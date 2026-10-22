-- ============================================================
-- KLYRO — PHASE 4 DATABASE MIGRATION
-- File: database/migration_phase4.sql
-- Description: Safe, additive, idempotent schema migration
-- Rule: Non-destructive; preserves all existing tables and data.
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. BATTLES TABLE & ENHANCEMENTS
-- Supports dynamic timed battle instances between teams and challenges.
-- We keep CREATE TABLE IF NOT EXISTS for fresh installs, and ADD COLUMN IF NOT EXISTS
-- so pre-existing battles tables safely receive missing columns without affecting existing rows.
CREATE TABLE IF NOT EXISTS battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'EVALUATING', 'COMPLETED', 'ABANDONED')),
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE battles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'IN_PROGRESS';
ALTER TABLE battles ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE battles ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Index for battle queries
CREATE INDEX IF NOT EXISTS idx_battles_team ON battles(team_id);
CREATE INDEX IF NOT EXISTS idx_battles_challenge ON battles(challenge_id);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);

-- 3. CHALLENGES ENHANCEMENTS
-- Add category and time_limit_minutes for lobby filtering & battle clock
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'FULL_STACK';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS time_limit_minutes INT DEFAULT 60;

-- 4. SUBMISSIONS ENHANCEMENTS
-- Note: submissions.repo_url remains the canonical repository URL column.
-- We add battle_id, live_url, and team_xp_awarded.
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS battle_id UUID REFERENCES battles(id) ON DELETE SET NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS live_url TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS team_xp_awarded INT DEFAULT 0;

-- -----------------------------------------------------------------------------
-- Safely update/create CHECK constraint on public.submissions.status to permit 'DEGRADED'
-- Prerequisites:
-- 1. Table public.submissions must exist.
-- 2. Any existing rows in public.submissions.status must be NULL or valid statuses:
--    ('SUBMITTED', 'EVALUATING', 'EVALUATED', 'FAILED', 'DEGRADED').
-- Guarantees:
-- - Explicitly targets public.submissions.
-- - Only inspects and modifies single-column CHECK constraints on status.
-- - Multi-column, primary key, foreign key, and unique constraints are strictly preserved.
-- - Handles three valid states safely:
--     Case A: Up-to-date constraint permitting DEGRADED already exists (idempotent no-op).
--     Case B: Baseline constraint ('SUBMITTED', 'EVALUATING', 'EVALUATED', 'FAILED') exists (safely replaced).
--     Case C: No status CHECK constraint exists yet (safely added).
-- - If unrecognized or conflicting constraints exist, fails closed with an explicit error.
-- - Validates all existing row status values before applying constraints.
-- - Fully idempotent and safe to re-run.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_baseline_count INT := 0;
    v_updated_count INT := 0;
    v_unrecognized_count INT := 0;
    v_baseline_name TEXT := NULL;
    v_updated_name TEXT := NULL;
    v_unrecognized_info TEXT := '';
    v_invalid_statuses TEXT := NULL;
    v_test_updated TEXT;
    v_test_baseline TEXT;
    r RECORD;
BEGIN
    -- Pre-check: Ensure existing rows in public.submissions do not violate allowed statuses
    SELECT string_agg(DISTINCT quote_literal(status), ', ')
    INTO v_invalid_statuses
    FROM public.submissions
    WHERE status IS NOT NULL
      AND status NOT IN ('SUBMITTED', 'EVALUATING', 'EVALUATED', 'FAILED', 'DEGRADED');

    IF v_invalid_statuses IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot apply submissions status CHECK constraint: found invalid status value(s) in public.submissions: %. Manual data cleanup required.',
            v_invalid_statuses;
    END IF;

    -- Inspect all single-column CHECK constraints on public.submissions.status
    FOR r IN (
        SELECT con.conname, pg_get_constraintdef(con.oid) AS def
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'submissions'
          AND att.attname = 'status'
          AND con.contype = 'c'
          AND array_length(con.conkey, 1) = 1
    ) LOOP
        -- Fail-closed test for updated constraint: exactly 5 statuses, no additional clauses/statuses
        v_test_updated := regexp_replace(r.def, '(''SUBMITTED''|''EVALUATING''|''EVALUATED''|''FAILED''|''DEGRADED'')', '', 'g');
        v_test_updated := regexp_replace(v_test_updated, '::"?[a-zA-Z_ ]+"?(\[\])?', '', 'g');
        v_test_updated := regexp_replace(v_test_updated, '(\s+|CHECK|status|\yANY\y|\yARRAY\y|\yIN\y|=|,|\(|\)|\[|\])', '', 'gi');

        -- Fail-closed test for baseline constraint: exactly 4 statuses, no additional clauses/statuses
        v_test_baseline := regexp_replace(r.def, '(''SUBMITTED''|''EVALUATING''|''EVALUATED''|''FAILED'')', '', 'g');
        v_test_baseline := regexp_replace(v_test_baseline, '::"?[a-zA-Z_ ]+"?(\[\])?', '', 'g');
        v_test_baseline := regexp_replace(v_test_baseline, '(\s+|CHECK|status|\yANY\y|\yARRAY\y|\yIN\y|=|,|\(|\)|\[|\])', '', 'gi');

        -- Check if constraint strictly matches updated definition (all 5 statuses and zero residual tokens)
        IF v_test_updated = ''
           AND r.def LIKE '%''DEGRADED''%'
           AND r.def LIKE '%''SUBMITTED''%'
           AND r.def LIKE '%''EVALUATING''%'
           AND r.def LIKE '%''EVALUATED''%'
           AND r.def LIKE '%''FAILED''%' THEN
            v_updated_count := v_updated_count + 1;
            v_updated_name := r.conname;
        -- Check if constraint strictly matches baseline definition (all 4 statuses and zero residual tokens)
        ELSIF v_test_baseline = ''
              AND r.def LIKE '%''SUBMITTED''%'
              AND r.def LIKE '%''EVALUATING''%'
              AND r.def LIKE '%''EVALUATED''%'
              AND r.def LIKE '%''FAILED''%' THEN
            v_baseline_count := v_baseline_count + 1;
            v_baseline_name := r.conname;
        ELSE
            -- Constraint has extra statuses, additional conditions, or unrecognized structure
            v_unrecognized_count := v_unrecognized_count + 1;
            v_unrecognized_info := v_unrecognized_info || quote_ident(r.conname) || ' (' || r.def || '); ';
        END IF;
    END LOOP;

    -- Safety Check 1: Disallow unrecognized constraints on status
    IF v_unrecognized_count > 0 THEN
        RAISE EXCEPTION 'Found % unrecognized CHECK constraint(s) on public.submissions.status: %. Cannot safely proceed without manual inspection.',
            v_unrecognized_count, v_unrecognized_info;
    END IF;

    -- Safety Check 2: Disallow conflicting states where both baseline and updated constraints exist
    IF v_baseline_count > 0 AND v_updated_count > 0 THEN
        RAISE EXCEPTION 'Conflicting constraints detected on public.submissions.status: baseline constraint "%" and updated constraint "%" both exist simultaneously. Manual cleanup required.',
            v_baseline_name, v_updated_name;
    END IF;

    -- Safety Check 3: Disallow duplicate baseline constraints
    IF v_baseline_count > 1 THEN
        RAISE EXCEPTION 'Multiple (% constraints) baseline CHECK constraints found on public.submissions.status. Cannot safely determine which constraint to update.',
            v_baseline_count;
    END IF;

    -- Safety Check 4: Disallow duplicate updated constraints
    IF v_updated_count > 1 THEN
        RAISE EXCEPTION 'Multiple (% constraints) updated CHECK constraints found on public.submissions.status. Manual review required.',
            v_updated_count;
    END IF;

    -- Case A: Exactly one updated constraint exists (idempotent success)
    IF v_updated_count = 1 AND v_baseline_count = 0 THEN
        RAISE NOTICE 'public.submissions.status CHECK constraint "%" already permits DEGRADED. Schema is up to date; no changes applied.',
            v_updated_name;
        RETURN;
    END IF;

    -- Case B: Exactly one baseline constraint exists -> safely replace it
    IF v_baseline_count = 1 AND v_updated_count = 0 THEN
        EXECUTE 'ALTER TABLE public.submissions DROP CONSTRAINT ' || quote_ident(v_baseline_name);

        ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check
            CHECK (status IN ('SUBMITTED', 'EVALUATING', 'EVALUATED', 'FAILED', 'DEGRADED'));

        RAISE NOTICE 'Replaced baseline status constraint "%" with "submissions_status_check" permitting DEGRADED.',
            v_baseline_name;
        RETURN;
    END IF;

    -- Case C: No status CHECK constraint currently exists -> safely add it
    IF v_baseline_count = 0 AND v_updated_count = 0 THEN
        ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check
            CHECK (status IN ('SUBMITTED', 'EVALUATING', 'EVALUATED', 'FAILED', 'DEGRADED'));

        RAISE NOTICE 'Added "submissions_status_check" constraint permitting DEGRADED on public.submissions.';
    END IF;
END $$;

-- Index for submission queries
CREATE INDEX IF NOT EXISTS idx_submissions_battle ON submissions(battle_id);

-- 5. TEAMS ENHANCEMENTS
-- Add total_xp for team leaderboards
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0;

-- 6. EVALUATIONS ENHANCEMENTS
-- total_score must allow NULL when an evaluation is in DEGRADED mode
ALTER TABLE evaluations ALTER COLUMN total_score DROP NOT NULL;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'SUCCESS';

-- 7. SHOWCASE PROJECTS ENHANCEMENTS
ALTER TABLE showcase_projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- END OF MIGRATION
-- Note: user_stats remains the sole authoritative store for player
-- XP, ratings, and battle win/loss counts. No columns added to profiles.
-- ============================================================

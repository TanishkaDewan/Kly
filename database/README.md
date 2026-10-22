# Klyro Database Configuration & Schemas

This directory contains the SQL schema definitions and migrations for the Klyro platform, hosted on **PostgreSQL 15+** via **Supabase**.

---

## Files in this Directory

| File | Description | Purpose |
| :--- | :--- | :--- |
| `schema.sql` | Baseline PostgreSQL schema | Creates core tables: profiles, skills, profile_skills, matchmaking_queue, teams, team_members, challenges, submissions, evaluations, evaluation_scores, contribution_analysis, showcase_projects, user_stats, and xp_transactions. |
| `migration_phase4.sql` | Phase 4 Additive Migration | Safe, idempotent migration script that adds the `battles` table, adds challenge duration/category fields, links submissions to battles, and safely permits the `'DEGRADED'` status on submissions without dropping existing data. |
| `functions.sql` | Database Functions & Triggers | Utility SQL functions and trigger definitions. |
| `seed.sql` | Seed Data Template | Initial seed values for skills catalog and sample challenge prompts. |

---

## Deployment & Setup Guide (Supabase)

### Step 1: Create a Supabase Project
1. Log in to [Supabase Console](https://supabase.com).
2. Create a new organization and project (e.g. `klyro-prod`).
3. Note your **Project URL**, **Anon Key**, and **Service Role Key** under **Project Settings > API**.

### Step 2: Apply Database Schemas
Navigate to the **SQL Editor** in your Supabase dashboard:

1. **Run Baseline Schema (`schema.sql`)**:
   - Open and copy the contents of `schema.sql`.
   - Paste into the SQL Editor and click **Run**.
   - This enables `uuid-ossp` and provisions all core relational tables with foreign keys and cascaded deletions.

2. **Apply Phase 4 Migration (`migration_phase4.sql`)**:
   - Open and copy the contents of `migration_phase4.sql`.
   - Paste into the SQL Editor and click **Run**.
   - This migration is non-destructive and idempotent. It creates the `battles` table, creates indexes (`idx_battles_team`, `idx_battles_challenge`, `idx_battles_status`), adds missing columns to `challenges` and `submissions`, and ensures the `DEGRADED` status constraint is in place.

### Step 3: Configure Row Level Security (RLS) & API Access
- **Backend Service**: Uses `SUPABASE_SERVICE_ROLE_KEY` to securely bypass RLS for administrative operations (matchmaking, evaluations, updating team statuses, rating transactions).
- **Frontend Client**: Uses `VITE_SUPABASE_ANON_KEY` to authenticate users and query publicly readable tables (profiles, challenges, showcase, leaderboards).

For detailed entity-relationship diagrams and data dictionary, refer to [`../docs/DATABASE_SCHEMA.md`](../docs/DATABASE_SCHEMA.md).

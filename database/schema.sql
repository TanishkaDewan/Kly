-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & SKILLS
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    github_username VARCHAR(100) NOT NULL,
    experience_level VARCHAR(20) CHECK (experience_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    role VARCHAR(20) DEFAULT 'PLAYER' CHECK (role IN ('PLAYER', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL -- 'FRONTEND', 'BACKEND', 'AI_ML', etc.
);

CREATE TABLE IF NOT EXISTS profile_skills (
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, skill_id)
);

-- 2. MATCHMAKING & TEAMS
CREATE TABLE IF NOT EXISTS matchmaking_queue (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    skill_category VARCHAR(50) NOT NULL,
    rematch_count INT DEFAULT 0,
    entered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'CONFIRMED', 'REJECTED', 'DISBANDED')),
    challenge_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_in_team VARCHAR(50),
    consent_status VARCHAR(20) DEFAULT 'PENDING' CHECK (consent_status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    responded_at TIMESTAMPTZ,
    PRIMARY KEY (team_id, profile_id)
);

-- 3. CHALLENGES & BATTLES
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB NOT NULL,
    constraints JSONB NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    status VARCHAR(20) DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ACTIVE', 'EVALUATION', 'COMPLETED')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_team_challenge'
    ) THEN
        ALTER TABLE teams ADD CONSTRAINT fk_team_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id);
    END IF;
END $$;

-- 4. SUBMISSIONS & EVALUATIONS
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    repo_url TEXT NOT NULL,
    submitted_by UUID REFERENCES profiles(id),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'EVALUATING', 'EVALUATED', 'FAILED')),
    CONSTRAINT unique_team_challenge_submission UNIQUE (team_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    total_score NUMERIC(5, 2) NOT NULL,
    rank INT,
    feedback_summary TEXT,
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    suspicious_flags JSONB DEFAULT NULL,
    raw_ai_response JSONB,
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    dimension VARCHAR(50) NOT NULL,
    raw_score NUMERIC(5, 2) NOT NULL,
    weight NUMERIC(3, 2) NOT NULL,
    weighted_score NUMERIC(5, 2) NOT NULL,
    status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS contribution_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    github_username VARCHAR(100) NOT NULL,
    estimated_percentage NUMERIC(5, 2) NOT NULL,
    summary TEXT,
    signals JSONB NOT NULL
);

-- 5. GAMIFICATION & LEADERBOARD
CREATE TABLE IF NOT EXISTS user_stats (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    xp INT DEFAULT 0,
    rating INT DEFAULT 1000,
    current_streak INT DEFAULT 0,
    battles_played INT DEFAULT 0,
    battles_won INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SHOWCASE
CREATE TABLE IF NOT EXISTS showcase_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    consented_at TIMESTAMPTZ,
    CONSTRAINT unique_showcase_submission UNIQUE (submission_id)
);
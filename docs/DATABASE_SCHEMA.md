# KLYRO — Database Schema Specification (`/docs/DATABASE_SCHEMA.md`)

> **Master Relational Database Architecture Documentation**  
> **Engine**: PostgreSQL 15+ (Hosted on Supabase)  
> **Primary Owner**: Member 2 (Backend & Database)

---

## 1. Overview & Entity Relationship Summary

The Klyro database schema manages user profiles, matchmaking queues, battle teams, challenge specifications, automated evaluations, AI feedback, user gamification stats (XP, Rating, Streaks), and showcase galleries.

```
[ auth.users ] (Supabase Auth)
       │ 1:1
       ▼
[ profiles ] ───< [ profile_skills ] >─── [ skills ]
       │                                       │
       ├───────────────┐                       │
       ▼               ▼                       │
[ matchmaking_queue ]  [ team_members ]         │
                           │ N:1               │
                           ▼                   │
                       [ teams ]               │
                          │                    │
                          ├───< [ submissions ] │
                          │          │         │
                          ▼          ▼         │
                     [ challenges ] ◄┴─────────┘
                          │
                          ▼
                    [ evaluations ] ──┬──> [ evaluation_scores ]
                          │           └──> [ contribution_analysis ]
                          ▼
                 [ showcase_projects ]

[ profiles ] ───> [ user_stats ]
[ profiles ] ───> [ xp_transactions ]
```

---

## 2. Table Specifications

### Module 1: Profiles & Skills

#### 1. `profiles`
Stores user profile metadata linked to Supabase Auth UUID.
- `id` (`UUID`, Primary Key, FK -> `auth.users.id` ON DELETE CASCADE)
- `username` (`VARCHAR(50)`, Unique, NOT NULL)
- `full_name` (`VARCHAR(100)`, NOT NULL)
- `avatar_url` (`TEXT`, Nullable)
- `github_username` (`VARCHAR(100)`, NOT NULL)
- `experience_level` (`VARCHAR(20)`, CHECK IN (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`))
- `role` (`VARCHAR(20)`, DEFAULT `'PLAYER'`, CHECK IN (`PLAYER`, `ADMIN`))
- `created_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)
- `updated_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)

#### 2. `skills`
Master catalog of software engineering skill categories.
- `id` (`UUID`, Primary Key, DEFAULT `uuid_generate_v4()`)
- `name` (`VARCHAR(50)`, Unique, NOT NULL)
- `category` (`VARCHAR(50)`, NOT NULL — e.g. `'FRONTEND'`, `'BACKEND'`, `'AI_ML'`)

#### 3. `profile_skills`
Junction table mapping players to their declared skills.
- `profile_id` (`UUID`, FK -> `profiles.id` ON DELETE CASCADE)
- `skill_id` (`UUID`, FK -> `skills.id` ON DELETE CASCADE)
- *Primary Key*: (`profile_id`, `skill_id`)

---

### Module 2: Matchmaking & Teams

#### 4. `matchmaking_queue`
Active waiting queue for automated team formation.
- `profile_id` (`UUID`, Primary Key, FK -> `profiles.id` ON DELETE CASCADE)
- `skill_category` (`VARCHAR(50)`, NOT NULL)
- `rematch_count` (`INT`, DEFAULT `0`)
- `entered_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)

#### 5. `teams`
Formed teams competing in software engineering challenges.
- `id` (`UUID`, Primary Key, DEFAULT `uuid_generate_v4()`)
- `name` (`VARCHAR(100)`, Nullable)
- `status` (`VARCHAR(20)`, DEFAULT `'PROPOSED'`, CHECK IN (`PROPOSED`, `CONFIRMED`, `REJECTED`, `DISBANDED`))
- `challenge_id` (`UUID`, FK -> `challenges.id`, Nullable)
- `created_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)

#### 6. `team_members`
Association between users and active teams.
- `team_id` (`UUID`, FK -> `teams.id` ON DELETE CASCADE)
- `profile_id` (`UUID`, FK -> `profiles.id` ON DELETE CASCADE)
- `role_in_team` (`VARCHAR(50)`, Nullable)
- `consent_status` (`VARCHAR(20)`, DEFAULT `'PENDING'`, CHECK IN (`PENDING`, `ACCEPTED`, `REJECTED`))
- `responded_at` (`TIMESTAMPTZ`, Nullable)
- *Primary Key*: (`team_id`, `profile_id`)

---

### Module 3: Challenges & Submissions

#### 7. `challenges`
Competitive hackathon / software arena problem specifications.
- `id` (`UUID`, Primary Key, DEFAULT `uuid_generate_v4()`)
- `title` (`VARCHAR(200)`, NOT NULL)
- `slug` (`VARCHAR(200)`, Unique, NOT NULL)
- `description` (`TEXT`, NOT NULL)
- `requirements` (`JSONB`, NOT NULL)
- `constraints` (`JSONB`, NOT NULL)
- `difficulty` (`VARCHAR(20)`, CHECK IN (`EASY`, `MEDIUM`, `HARD`))
- `status` (`VARCHAR(20)`, DEFAULT `'UPCOMING'`, CHECK IN (`UPCOMING`, `ACTIVE`, `EVALUATION`, `COMPLETED`))
- `start_time` (`TIMESTAMPTZ`, NOT NULL)
- `end_time` (`TIMESTAMPTZ`, NOT NULL)
- `created_by` (`UUID`, FK -> `profiles.id`, Nullable)
- `created_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)

#### 8. `submissions`
Team challenge repository submissions.
- `id` (`UUID`, Primary Key, DEFAULT `uuid_generate_v4()`)
- `team_id` (`UUID`, FK -> `teams.id` ON DELETE CASCADE)
- `challenge_id` (`UUID`, FK -> `challenges.id` ON DELETE CASCADE)
- `repo_url` (`TEXT`, NOT NULL)
- `submitted_by` (`UUID`, FK -> `profiles.id`, Nullable)
- `submitted_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)
- `status` (`VARCHAR(20)`, DEFAULT `'SUBMITTED'`, CHECK IN (`SUBMITTED`, `EVALUATING`, `EVALUATED`, `FAILED`))
- *Constraint*: `UNIQUE(team_id, challenge_id)`

---

### Module 4: AI Evaluation & Feedback

#### 9. `evaluations`
Master AI evaluation record generated by Gemini.
- `id` (`UUID`, Primary Key, DEFAULT `uuid_generate_v4()`)
- `submission_id` (`UUID`, Unique, FK -> `submissions.id` ON DELETE CASCADE)
- `team_id` (`UUID`, FK -> `teams.id` ON DELETE CASCADE)
- `challenge_id` (`UUID`, FK -> `challenges.id` ON DELETE CASCADE)
- `total_score` (`NUMERIC(5, 2)`, NOT NULL)
- `rank` (`INT`, Nullable)
- `feedback_summary` (`TEXT`, Nullable)
- `strengths` (`JSONB`, DEFAULT `'[]'::jsonb`)
- `weaknesses` (`JSONB`, DEFAULT `'[]'::jsonb`)
- `recommendations` (`JSONB`, DEFAULT `'[]'::jsonb`)
- `suspicious_flags` (`JSONB`, DEFAULT `NULL`)
- `raw_ai_response` (`JSONB`, Nullable)
- `evaluated_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)

#### 10. `evaluation_scores`
Individual breakdown per scoring dimension.
- `id` (`UUID`, Primary Key, DEFAULT `uuid_generate_v4()`)
- `evaluation_id` (`UUID`, FK -> `evaluations.id` ON DELETE CASCADE)
- `dimension` (`VARCHAR(50)`, NOT NULL)
- `raw_score` (`NUMERIC(5, 2)`, NOT NULL)
- `weight` (`NUMERIC(3, 2)`, NOT NULL)
- `weighted_score` (`NUMERIC(5, 2)`, NOT NULL)
- `status` (`VARCHAR(20)`, Nullable)

#### 11. `contribution_analysis`
Per-developer attribution breakdown calculated from GitHub commit history.
- `id` (`UUID`, Primary Key, DEFAULT `uuid_generate_v4()`)
- `evaluation_id` (`UUID`, FK -> `evaluations.id` ON DELETE CASCADE)
- `profile_id` (`UUID`, FK -> `profiles.id` ON DELETE CASCADE)
- `github_username` (`VARCHAR(100)`, NOT NULL)
- `estimated_percentage` (`NUMERIC(5, 2)`, NOT NULL)
- `summary` (`TEXT`, Nullable)
- `signals` (`JSONB`, NOT NULL)

---

### Module 5: Gamification & Showcase

#### 12. `user_stats`
Leaderboard rankings, XP points, and battle statistics.
- `profile_id` (`UUID`, Primary Key, FK -> `profiles.id` ON DELETE CASCADE)
- `xp` (`INT`, DEFAULT `0`)
- `rating` (`INT`, DEFAULT `1000`)
- `current_streak` (`INT`, DEFAULT `0`)
- `battles_played` (`INT`, DEFAULT `0`)
- `battles_won` (`INT`, DEFAULT `0`)
- `updated_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)

#### 13. `xp_transactions`
Auditable log of user XP rewards.
- `id` (`UUID`, Primary Key, DEFAULT `uuid_generate_v4()`)
- `profile_id` (`UUID`, FK -> `profiles.id` ON DELETE CASCADE)
- `amount` (`INT`, NOT NULL)
- `reason` (`VARCHAR(100)`, NOT NULL)
- `reference_id` (`UUID`, Nullable)
- `created_at` (`TIMESTAMPTZ`, DEFAULT `NOW()`)

#### 14. `showcase_projects`
Opt-in showcase gallery for high-scoring submitted projects.
- `id` (`UUID`, Primary Key, DEFAULT `uuid_generate_v4()`)
- `challenge_id` (`UUID`, FK -> `challenges.id` ON DELETE CASCADE)
- `team_id` (`UUID`, FK -> `teams.id` ON DELETE CASCADE)
- `submission_id` (`UUID`, Unique, FK -> `submissions.id` ON DELETE CASCADE)
- `is_public` (`BOOLEAN`, DEFAULT `FALSE`)
- `consented_at` (`TIMESTAMPTZ`, Nullable)

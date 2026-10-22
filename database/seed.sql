-- ============================================================
-- KLYRO — SEED DATA: 12 Problem Statements (8-Hour Challenges)
-- File: database/seed.sql
-- ============================================================

-- 1. Automatic Profile & Stats Creation Trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    github_username,
    avatar_url,
    experience_level,
    role
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'github_username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'experience_level', 'INTERMEDIATE'),
    'PLAYER'
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

  INSERT INTO public.user_stats (profile_id, rating, xp, battles_played, battles_won)
  VALUES (new.id, 1000, 0, 0, 0)
  ON CONFLICT (profile_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Skills Catalog
INSERT INTO public.skills (name, category) VALUES
  ('React', 'FRONTEND'),
  ('Vue.js', 'FRONTEND'),
  ('TypeScript', 'FRONTEND'),
  ('Tailwind CSS', 'FRONTEND'),
  ('Node.js', 'BACKEND'),
  ('Express', 'BACKEND'),
  ('PostgreSQL', 'BACKEND'),
  ('Python', 'AI_ML'),
  ('FastAPI', 'BACKEND'),
  ('PyTorch', 'AI_ML'),
  ('Google Gemini', 'AI_ML'),
  ('Docker', 'DEVOPS')
ON CONFLICT (name) DO NOTHING;


-- 3. 12 Problem Statements (All set to 480-minute / 8-hour countdown)
INSERT INTO public.challenges (title, slug, category, difficulty, time_limit_minutes, status, start_time, end_time, description, requirements, constraints)
VALUES
(
  'Distributed Event-Driven Order Processing Engine',
  'distributed-order-engine',
  'BACKEND',
  'HARD',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Design and implement a high-throughput, idempotent order processing service capable of handling concurrent checkout requests with distributed locking, out-of-order event reconciliation, and transactional outbox messaging.',
  '["Implement idempotent POST /api/orders endpoint with deduplication keys", "Use transactional outbox pattern or distributed locks for concurrency safety", "Handle inventory decrement with rollback compensation on payment failure", "Expose health check and telemetry metrics endpoint (Prometheus or JSON format)", "Include automated unit and integration tests covering race conditions"]'::jsonb,
  '["Sub-50ms p95 latency under concurrent load", "Zero double-spending or negative inventory states permitted", "Clean modular architecture with separation of domain logic and infrastructure"]'::jsonb
),
(
  'AI-Powered Code Review & Security Vulnerability Scanner',
  'ai-code-scanner',
  'AI_ML',
  'HARD',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Build an automated pipeline that ingests git commit diffs, performs AST and regex static analysis for OWASP Top 10 vulnerabilities (SQLi, SSRF, Hardcoded Secrets), and synthesizes remediation patches using an LLM API.',
  '["Parse git unified diffs and extract file modifications and line ranges", "Implement deterministic AST/regex scanners for hardcoded API keys and raw SQL queries", "Call LLM API (Gemini/OpenAI) with structured prompt to generate contextual fixes", "Output normalized JSON report with severity levels (CRITICAL, HIGH, MEDIUM, LOW)", "Provide CLI or REST API to trigger scan on any public repository"]'::jsonb,
  '["Must sanitize input prompts to prevent prompt injection from scanned code", "Provide fallback responses when LLM rate limits are encountered"]'::jsonb
),
(
  'Real-Time Collaborative Canvas & Whiteboard',
  'collaborative-canvas',
  'FRONTEND',
  'MEDIUM',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Create an ultra-responsive multiplayer drawing and diagramming canvas with live cursor tracking, conflict-free state synchronization (CRDT or Operational Transformation), and undo/redo history.',
  '["HTML5 Canvas or SVG renderer supporting freehand drawing, rectangles, arrows, and text", "Multiplayer cursor broadcasting with smooth interpolation (<30ms latency)", "State synchronization via WebSockets with room isolation", "Local optimistic updates with undo/redo stack", "Export canvas state to PNG image and serialized JSON"]'::jsonb,
  '["60 FPS rendering during multi-user simultaneous drawing", "Responsive design adapting to mobile and desktop touch/mouse inputs"]'::jsonb
),
(
  'Resilient API Gateway & Dynamic Rate Limiter',
  'resilient-api-gateway',
  'DEVOPS',
  'MEDIUM',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Architect a reverse proxy and API gateway featuring token-bucket distributed rate limiting, circuit breaker pattern with exponential backoff, request header mutation, and live traffic analytics.',
  '["Reverse proxy routing requests to configurable downstream backend services", "Sliding window or token bucket rate limiter per API key / IP address", "Circuit breaker implementation: transitions between CLOSED, OPEN, and HALF-OPEN states", "Structured request logging with correlated Trace IDs across client and upstream", "Admin dashboard or endpoint displaying real-time traffic statistics"]'::jsonb,
  '["Under 5ms proxy overhead latency added to upstream requests", "Graceful degradation when upstream services timeout or fail"]'::jsonb
),
(
  'Decentralized Cryptographic Key Vault & Audit Trail',
  'crypto-key-vault',
  'SECURITY',
  'HARD',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Develop a zero-trust cryptographic secrets manager that provides envelope encryption (AES-256-GCM), key rotation policies, HMAC request verification, and an append-only tamper-evident audit log.',
  '["AES-256-GCM authenticated encryption for secret values at rest", "Master key derivation using PBKDF2 or Argon2id with unique salt", "Append-only cryptographic hash chain (Merkle tree / blockchain-style) for audit logs", "Time-based or version-based secret rotation endpoint", "Strict role-based access control (RBAC) protecting secret read/write access"]'::jsonb,
  '["Zero plaintext secret logging; secrets must never appear in logs or memory dumps", "Constant-time string comparison for cryptographic signatures"]'::jsonb
),
(
  'High-Frequency Financial Order Book & Matching Engine',
  'orderbook-matching-engine',
  'FULLSTACK',
  'HARD',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Build a deterministic continuous double-auction order book that matches Limit and Market orders following price-time priority (FIFO), streams order book depth over WebSockets, and renders a live visual trade ladder.',
  '["Deterministic matching engine supporting Limit, Market, and Cancel order types", "Price-time priority execution with partial fill handling", "BBO (Best Bid & Offer) and Level 2 depth streaming via WebSocket", "Interactive frontend rendering order book bids/asks with depth bars", "Execution log recording executed trade prices, quantities, and counterparty IDs"]'::jsonb,
  '["Sub-millisecond matching latency for in-memory queue", "Zero float rounding errors (use integer ticks / cents for all pricing)"]'::jsonb
),
(
  'Vector Semantic Search & Multi-Document RAG Pipeline',
  'vector-rag-pipeline',
  'AI_ML',
  'MEDIUM',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Create an intelligent document retrieval and question-answering system that chunks PDF and Markdown documents, computes dense vector embeddings, performs cosine similarity search, and answers queries with strict citations.',
  '["Document chunking with configurable overlap (e.g., 500 characters, 50 overlap)", "Vector embedding generation using open-source models or OpenAI/Gemini embeddings", "Cosine similarity vector search with top-K reranking", "Prompt synthesis requiring source citation ([Doc: Page]) in responses", "Web interface allowing file upload and interactive query chat"]'::jsonb,
  '["Hallucination prevention: system must decline to answer if context is absent", "Vector search query latency under 150ms"]'::jsonb
),
(
  'Interactive 3D WebGL Audio Visualizer & Synthesizer',
  'webgl-audio-visualizer',
  'FRONTEND',
  'EASY',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Build an immersive browser-based 3D audio synthesizer and frequency visualizer using Web Audio API and Three.js / WebGL shaders that react dynamically to microphone input or audio files.',
  '["Web Audio API AnalyserNode extracting frequency data and waveform byte arrays", "Three.js or custom WebGL shader scene morphing geometry based on audio frequencies", "Interactive controls for bloom, particle count, camera orbit, and color palettes", "Built-in oscillator synthesizer with customizable waveform (Sine, Square, Sawtooth)", "Audio file drag-and-drop and microphone stream toggle"]'::jsonb,
  '["Smooth 60 FPS performance with at least 5,000 animated particles", "Zero audio crackle or garbage collection stuttering during playback"]'::jsonb
),
(
  'E-Commerce Cart API',
  'e-commerce-cart-api',
  'BACKEND',
  'EASY',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Build a robust RESTful Shopping Cart API supporting session persistence, coupon code validation, subtotal/tax calculations, and cart expiry handling.',
  '["POST /api/cart/items to add product with quantity", "GET /api/cart to calculate subtotals and discounts", "DELETE /api/cart/items/:id to remove items", "Automated unit tests for discount edge cases"]'::jsonb,
  '["Safe decimal arithmetic for all monetary amounts", "Strict input validation against negative quantities"]'::jsonb
),
(
  'Real-time Chat UI',
  'real-time-chat-ui',
  'FRONTEND',
  'MEDIUM',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Create a modern, responsive chat client featuring message threading, typing indicators, read receipts, and rich media message attachments.',
  '["Optimistic message rendering with delivery status ticks", "Live typing indicators and active presence indicators", "Message search and thread view modal", "Accessible keyboard navigation and dark mode palette"]'::jsonb,
  '["No layout shifts when messages or attachments load", "Accessible color contrast complying with WCAG AA"]'::jsonb
),
(
  'Fraud Detection Model',
  'fraud-detection-model',
  'AI_ML',
  'HARD',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Develop an anomaly detection and transaction classification service that identifies suspicious credit card transactions using gradient boosting or autoencoder models.',
  '["Feature engineering pipeline extracting velocity, geolocation delta, and amount z-scores", "Model inference endpoint evaluating transactions in under 20ms", "Explainability output returning the top 3 contributing risk factors", "Comprehensive test suite testing high false-positive edge cases"]'::jsonb,
  '["Inference latency p99 strictly under 50ms", "Zero data leakage between training and validation sets"]'::jsonb
),
(
  'KLYRO Competitive Coding Frontend Arena',
  'klyro-frontend-arena',
  'FRONTEND',
  'HARD',
  480,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Build a high-stakes competitive software battle cockpit featuring live timer countdowns, GitHub repository submission validation, real-time squad telemetry, and animated scoring breakdown.',
  '["Live WebSocket / polling countdown clock with sub-second accuracy", "GitHub repository format validation with branch inspection", "Interactive multi-dimensional score radial chart", "Dark mode aesthetic with glassmorphic accents"]'::jsonb,
  '["Zero render jank during active clock countdown", "Mobile responsive HUD layout"]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  time_limit_minutes = 480,
  status = 'ACTIVE',
  requirements = EXCLUDED.requirements,
  constraints = EXCLUDED.constraints,
  description = EXCLUDED.description;

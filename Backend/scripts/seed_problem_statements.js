require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');

const PROBLEM_STATEMENTS = [
  {
    title: 'Distributed Event-Driven Order Processing Engine',
    slug: 'distributed-order-engine',
    category: 'BACKEND',
    difficulty: 'HARD',
    time_limit_minutes: 480,
    status: 'ACTIVE',
    description: 'Design and implement a high-throughput, idempotent order processing service capable of handling concurrent checkout requests with distributed locking, out-of-order event reconciliation, and transactional outbox messaging.',
    requirements: [
      'Implement idempotent POST /api/orders endpoint with deduplication keys',
      'Use transactional outbox pattern or distributed locks for concurrency safety',
      'Handle inventory decrement with rollback compensation on payment failure',
      'Expose health check and telemetry metrics endpoint (Prometheus or JSON format)',
      'Include automated unit and integration tests covering race conditions'
    ],
    constraints: [
      'Sub-50ms p95 latency under concurrent load',
      'Zero double-spending or negative inventory states permitted',
      'Clean modular architecture with separation of domain logic and infrastructure'
    ]
  },
  {
    title: 'AI-Powered Code Review & Security Vulnerability Scanner',
    slug: 'ai-code-scanner',
    category: 'AI_ML',
    difficulty: 'HARD',
    time_limit_minutes: 480,
    status: 'ACTIVE',
    description: 'Build an automated pipeline that ingests git commit diffs, performs AST and regex static analysis for OWASP Top 10 vulnerabilities (SQLi, SSRF, Hardcoded Secrets), and synthesizes remediation patches using an LLM API.',
    requirements: [
      'Parse git unified diffs and extract file modifications and line ranges',
      'Implement deterministic AST/regex scanners for hardcoded API keys and raw SQL queries',
      'Call LLM API (Gemini/OpenAI) with structured prompt to generate contextual fixes',
      'Output normalized JSON report with severity levels (CRITICAL, HIGH, MEDIUM, LOW)',
      'Provide CLI or REST API to trigger scan on any public repository'
    ],
    constraints: [
      'Must sanitize input prompts to prevent prompt injection from scanned code',
      'Provide fallback responses when LLM rate limits are encountered'
    ]
  },
  {
    title: 'Real-Time Collaborative Canvas & Whiteboard',
    slug: 'collaborative-canvas',
    category: 'FRONTEND',
    difficulty: 'MEDIUM',
    time_limit_minutes: 480,
    status: 'ACTIVE',
    description: 'Create an ultra-responsive multiplayer drawing and diagramming canvas with live cursor tracking, conflict-free state synchronization (CRDT or Operational Transformation), and undo/redo history.',
    requirements: [
      'HTML5 Canvas or SVG renderer supporting freehand drawing, rectangles, arrows, and text',
      'Multiplayer cursor broadcasting with smooth interpolation (<30ms latency)',
      'State synchronization via WebSockets with room isolation',
      'Local optimistic updates with undo/redo stack',
      'Export canvas state to PNG image and serialized JSON'
    ],
    constraints: [
      '60 FPS rendering during multi-user simultaneous drawing',
      'Responsive design adapting to mobile and desktop touch/mouse inputs'
    ]
  },
  {
    title: 'Resilient API Gateway & Dynamic Rate Limiter',
    slug: 'resilient-api-gateway',
    category: 'DEVOPS',
    difficulty: 'MEDIUM',
    time_limit_minutes: 480,
    status: 'ACTIVE',
    description: 'Architect a reverse proxy and API gateway featuring token-bucket distributed rate limiting, circuit breaker pattern with exponential backoff, request header mutation, and live traffic analytics.',
    requirements: [
      'Reverse proxy routing requests to configurable downstream backend services',
      'Sliding window or token bucket rate limiter per API key / IP address',
      'Circuit breaker implementation: transitions between CLOSED, OPEN, and HALF-OPEN states',
      'Structured request logging with correlated Trace IDs across client and upstream',
      'Admin dashboard or endpoint displaying real-time traffic statistics'
    ],
    constraints: [
      'Under 5ms proxy overhead latency added to upstream requests',
      'Graceful degradation when upstream services timeout or fail'
    ]
  },
  {
    title: 'Decentralized Cryptographic Key Vault & Audit Trail',
    slug: 'crypto-key-vault',
    category: 'SECURITY',
    difficulty: 'HARD',
    time_limit_minutes: 480,
    status: 'ACTIVE',
    description: 'Develop a zero-trust cryptographic secrets manager that provides envelope encryption (AES-256-GCM), key rotation policies, HMAC request verification, and an append-only tamper-evident audit log.',
    requirements: [
      'AES-256-GCM authenticated encryption for secret values at rest',
      'Master key derivation using PBKDF2 or Argon2id with unique salt',
      'Append-only cryptographic hash chain (Merkle tree / blockchain-style) for audit logs',
      'Time-based or version-based secret rotation endpoint',
      'Strict role-based access control (RBAC) protecting secret read/write access'
    ],
    constraints: [
      'Zero plaintext secret logging; secrets must never appear in logs or memory dumps',
      'Constant-time string comparison for cryptographic signatures'
    ]
  },
  {
    title: 'High-Frequency Financial Order Book & Matching Engine',
    slug: 'orderbook-matching-engine',
    category: 'FULLSTACK',
    difficulty: 'HARD',
    time_limit_minutes: 480,
    status: 'ACTIVE',
    description: 'Build a deterministic continuous double-auction order book that matches Limit and Market orders following price-time priority (FIFO), streams order book depth over WebSockets, and renders a live visual trade ladder.',
    requirements: [
      'Deterministic matching engine supporting Limit, Market, and Cancel order types',
      'Price-time priority execution with partial fill handling',
      'BBO (Best Bid & Offer) and Level 2 depth streaming via WebSocket',
      'Interactive frontend rendering order book bids/asks with depth bars',
      'Execution log recording executed trade prices, quantities, and counterparty IDs'
    ],
    constraints: [
      'Sub-millisecond matching latency for in-memory queue',
      'Zero float rounding errors (use integer ticks / cents for all pricing)'
    ]
  },
  {
    title: 'Vector Semantic Search & Multi-Document RAG Pipeline',
    slug: 'vector-rag-pipeline',
    category: 'AI_ML',
    difficulty: 'MEDIUM',
    time_limit_minutes: 480,
    status: 'ACTIVE',
    description: 'Create an intelligent document retrieval and question-answering system that chunks PDF and Markdown documents, computes dense vector embeddings, performs cosine similarity search, and answers queries with strict citations.',
    requirements: [
      'Document chunking with configurable overlap (e.g., 500 characters, 50 overlap)',
      'Vector embedding generation using open-source models or OpenAI/Gemini embeddings',
      'Cosine similarity vector search with top-K reranking',
      'Prompt synthesis requiring source citation ([Doc: Page]) in responses',
      'Web interface allowing file upload and interactive query chat'
    ],
    constraints: [
      'Hallucination prevention: system must decline to answer if context is absent',
      'Vector search query latency under 150ms'
    ]
  },
  {
    title: 'Interactive 3D WebGL Audio Visualizer & Synthesizer',
    slug: 'webgl-audio-visualizer',
    category: 'FRONTEND',
    difficulty: 'EASY',
    time_limit_minutes: 480,
    status: 'ACTIVE',
    description: 'Build an immersive browser-based 3D audio synthesizer and frequency visualizer using Web Audio API and Three.js / WebGL shaders that react dynamically to microphone input or audio files.',
    requirements: [
      'Web Audio API AnalyserNode extracting frequency data and waveform byte arrays',
      'Three.js or custom WebGL shader scene morphing geometry based on audio frequencies',
      'Interactive controls for bloom, particle count, camera orbit, and color palettes',
      'Built-in oscillator synthesizer with customizable waveform (Sine, Square, Sawtooth)',
      'Audio file drag-and-drop and microphone stream toggle'
    ],
    constraints: [
      'Smooth 60 FPS performance with at least 5,000 animated particles',
      'Zero audio crackle or garbage collection stuttering during playback'
    ]
  }
];

async function seedProblemStatements() {
  console.log('==================================================');
  console.log('   KLYRO SEEDING: 8-Hour Problem Statements       ');
  console.log('==================================================');

  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days active

  for (const ps of PROBLEM_STATEMENTS) {
    const payload = {
      title: ps.title,
      slug: ps.slug,
      category: ps.category,
      difficulty: ps.difficulty,
      description: ps.description,
      requirements: ps.requirements,
      constraints: ps.constraints,
      time_limit_minutes: ps.time_limit_minutes,
      status: ps.status,
      start_time: now.toISOString(),
      end_time: future.toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('challenges')
      .upsert(payload, { onConflict: 'slug' })
      .select('id, title, slug, time_limit_minutes')
      .single();

    if (error) {
      console.error(`[Error seeding ${ps.slug}]:`, error.message);
    } else {
      console.log(`[Seeded PS]: ${data.title} (${data.time_limit_minutes}m / 8hrs) -> ID: ${data.id}`);
    }
  }

  // Update all existing challenges to 480 minutes (8 hours)
  console.log('\n--- Normalizing all existing challenges to 480 minutes (8 hours) ---');
  const { data: updatedAll, error: updateErr } = await supabaseAdmin
    .from('challenges')
    .update({ time_limit_minutes: 480 })
    .neq('time_limit_minutes', 480)
    .select('title');

  if (updateErr) {
    console.error('[Error updating challenges time]:', updateErr.message);
  } else {
    console.log(`[Updated existing challenges]: ${updatedAll?.length || 0} challenges set to 480 mins.`);
  }

  // Reset any active battles to 8 hours countdown from now!
  console.log('\n--- Resetting Active Battles to 8 Hours Countdown ---');
  const battleEndTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const { data: battlesReset, error: battleErr } = await supabaseAdmin
    .from('battles')
    .update({
      start_time: now.toISOString(),
      end_time: battleEndTime.toISOString(),
      status: 'IN_PROGRESS'
    })
    .eq('status', 'IN_PROGRESS')
    .select('id, team_id');

  if (battleErr) {
    console.error('[Error resetting battles]:', battleErr.message);
  } else {
    console.log(`[Battles Reset]: ${battlesReset?.length || 0} active battle(s) timer reset to 8 hours (ends at ${battleEndTime.toLocaleTimeString()}).`);
  }

  console.log('\n==================================================');
  console.log('   All Problem Statements & 8hr Timers Active!    ');
  console.log('==================================================');
}

seedProblemStatements().catch(console.error);

const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Middleware to verify Supabase JWT from Authorization header
 * Header format: Bearer <supabase_jwt_token>
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or malformed Authorization header. Expected: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token using Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token.'
      });
    }

    // Fetch user profile from the database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Attach authenticated user and profile to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'PLAYER',
      profile: profile || null
    };

    next();
  } catch (err) {
    console.error('[AuthMiddleware Error]:', err.message);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Authentication check failed.'
    });
  }
};

/**
 * Middleware to restrict access to ADMIN roles
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied. Administrator privileges required.'
    });
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin
};
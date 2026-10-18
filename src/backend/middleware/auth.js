// Authentication & Role Authorization Middleware
// Node.js handles backend role authorization

export function authenticate(req, res, next) {
  // Check authorization header or dev/mock header
  const authHeader = req.headers.authorization;
  const devUserId = req.headers['x-user-id'];
  const devUserRole = req.headers['x-user-role'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // Simple JWT token or mock token payload parser
    try {
      if (token.includes('.')) {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
        req.user = {
          id: payload.id || payload.userId,
          role: payload.role || 'student',
          name: payload.name || '',
          email: payload.email || '',
        };
        return next();
      }
    } catch (e) {
      // Continue to fallback
    }
  }

  // Support local development / testing headers
  if (devUserId) {
    req.user = {
      id: devUserId,
      role: devUserRole || 'student',
    };
    return next();
  }

  // Default guest/anonymous for public routes
  req.user = null;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication required',
    });
  }
  next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role`,
      });
    }

    next();
  };
}

const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      const account = jwt.verify(token, process.env.JWT_ACCESS_KEY);

      // Kiểm tra vai trò người dùng
      if (roles.length && !roles.includes(account.role)) {
        return res.status(403).json({ message: 'Access denied', 'role access': account.role });
      }

      next();
    } catch (err) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};

module.exports = authMiddleware;

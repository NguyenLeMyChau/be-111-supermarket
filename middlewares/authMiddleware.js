const jwt = require('jsonwebtoken');
require('dotenv').config(); // Đọc biến môi trường từ .env

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.account = decoded;

      // Kiểm tra vai trò người dùng
      if (roles.length && !roles.includes(req.account.role)) {
        return res.status(403).json({ message: 'Access denied','role access':req.account.role });
      }

      next();
    } catch (err) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};

module.exports = authMiddleware;

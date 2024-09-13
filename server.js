const express = require('express');
const connectDB = require('./config/configMongoDB');
const cors  =require('cors');
require('dotenv').config(); // Đọc biến môi trường từ .env

const app = express();
const PORT = process.env.PORT || 5000;

// Kết nối MongoDB
connectDB();

// Middleware xử lý JSON
app.use(cors()); // Sử dụng middleware để xử lý lỗi CORS
app.use(express.json());

// Định tuyến
app.use('/api/auth', require('./routes/authRoutes'));

// Route yêu cầu quyền 'admin'
app.get('/manager', require('./middlewares/authMiddleware')(['manager']), (req, res) => {
  res.json({ message: 'Welcome admin!' });
});

// Route yêu cầu quyền 'admin' hoặc 'staff'
app.get('/dashboard', require('./middlewares/authMiddleware')(['manager', 'staff']), (req, res) => {
  res.json({ message: `Welcome ${req.account.role}!` });
});

// Sử dụng PORT từ .env

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

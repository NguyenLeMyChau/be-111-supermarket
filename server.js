const express = require('express');
const cors = require("cors");
const dotenv = require('dotenv');
const http = require('http');
const bodyParser = require('body-parser');
const socketIo = require("socket.io");

const connectDB = require('./src/config/configMongoDB');
const handlerSocket = require('./socket');

// Load environment variables from .env file into process.env
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Tăng giới hạn cho payload JSON và URL-encoded
app.use(bodyParser.json({ limit: '2mb' })); // Đối với payload JSON
app.use(bodyParser.urlencoded({ limit: '2mb', extended: true })); // Đối với payload URL-encode

// Cấu hình middleware
app.use(express.json());
app.use(cors({
  origin: '*'
}));

// Kết nối tới MongoDB
connectDB();

const authMiddleware = require('./src/middlewares/authMiddleware');
const authRoutes = require('./src/routes/authRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');
const productRoutes = require('./src/routes/productRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const promotionRoutes = require('./src/routes/promotionRoutes');
const warehouseRoutes = require('./src/routes/warehouseRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const userRoutes = require('./src/routes/userRoutes');
const unitRoutes = require('./src/routes/unitRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const priceRoutes = require('./src/routes/priceRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const zalopay = require('./src/payment/zalopay/ZaloPay');
const payment = require('./src/routes/paymentWebRoute');

// ROUTES Manager
app.use('/api/auth', authRoutes);
app.use('/api/supplier', authMiddleware(['manager']), supplierRoutes);
app.use('/api/product', authMiddleware(['manager']), productRoutes);
app.use('/api/employee', authMiddleware(['manager']), employeeRoutes);
app.use('/api/promotion', authMiddleware(['manager']), promotionRoutes);
app.use('/api/warehouse', authMiddleware(['manager']), warehouseRoutes);
app.use('/api/unit', authMiddleware(['manager']), unitRoutes);
app.use('/api/price', authMiddleware(['manager']), priceRoutes);
app.use('/api/invoice', authMiddleware(['manager', 'staff', 'customer']), invoiceRoutes);
app.use('/api/zalo-pay', zalopay);
app.use('/api/payment', payment);

// ROUTES Customer
app.use('/api/customer', authMiddleware(['customer']), customerRoutes);

// ROUTES User
app.use('/api/user', authMiddleware(['manager', 'staff', 'customer']), userRoutes);
app.use('/api/upload', uploadRoutes);

// Route yêu cầu quyền 'admin'
app.get('/manager', authMiddleware(['manager']), (req, res) => {
  res.json({ message: 'Welcome admin!' });
});

// Route yêu cầu quyền 'admin' hoặc 'staff'
app.get('/dashboard', authMiddleware(['manager', 'staff']), (req, res) => {
  res.json({ message: `Welcome ${req.account.role}!` });
});

// Tạo HTTP server và WebSocket server
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

// Kết nối WebSocket
handlerSocket(io);

// API Test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello, this is a test API!' });
});

// Route trang chủ
app.get('/', (req, res) => {
  res.json({ message: 'Hello, welcome to supermarket' });
});

// Bắt đầu server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

const express = require('express');
const cors = require("cors");
const dotenv = require('dotenv');
const PORT = process.env.PORT || 5000;

const connectDB = require('./src/config/configMongoDB');

// Load environment variables from .env file into process.env 
dotenv.config();
const app = express();

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
const priceRoutes = require('./src/routes/priceRoutes')

// ROUTES Manager
app.use('/api/auth', authRoutes);
app.use('/api/supplier', authMiddleware(['manager']), supplierRoutes);
app.use('/api/product', authMiddleware(['manager']), productRoutes);
app.use('/api/employee', authMiddleware(['manager']), employeeRoutes);
app.use('/api/promotion', authMiddleware(['manager']), promotionRoutes);
app.use('/api/warehouse', authMiddleware(['manager']), warehouseRoutes);
app.use('/api/unit', authMiddleware(['manager']), unitRoutes);
app.use('/api/price', authMiddleware(['manager']), priceRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello, this is a test API!' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello, welcome to supermarket' });
});

module.exports = app;



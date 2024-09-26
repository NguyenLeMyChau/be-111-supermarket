const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const PORT = process.env.PORT || 5000;

const connectDB = require('./src/config/configMongoDB');
const authMiddleware = require('./src/middlewares/authMiddleware');
const authRoutes = require('./src/routes/authRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');
const productRoutes = require('./src/routes/productRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');


// Load environment variables from .env file into process.env 
dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

// Middleware for parsing incoming request bodies 
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/supplier', authMiddleware(['manager']), supplierRoutes);
app.use('/api/product', authMiddleware(['manager']), productRoutes);
app.use('/api/employee', authMiddleware(['manager']), employeeRoutes);

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



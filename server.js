const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const PORT = process.env.PORT || 5000;

const connectDB = require('./src/config/configMongoDB');
const authRoutes = require('./src/routes/authRoutes');
const authMiddleware = require('./src/middlewares/authMiddleware');

// Load environment variables from .env file into process.env 
dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

// Middleware for parsing incoming request bodies 
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// ROUTES
app.use('/api/auth', authRoutes);

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



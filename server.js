const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;
const cookieParser = require('cookie-parser');
require("dotenv").config(); // Load các biến môi trường từ file .env

// npx nodemon server.js // Chạy server

app.use(express.json()); // Sử dụng middleware để phân tích JSON gửi đến từ client
app.use(cors()); // Sử dụng middleware để xử lý lỗi CORS
app.use(cookieParser()); // Sử dụng middleware để phân tích cookie từ client

// Định nghĩa một route cơ bản
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Khởi động server và lắng nghe trên port 4000
app.listen(PORT, () => {
    console.log(`Server đang chạy trên port ${PORT}`);
});

// Kết nối tới cơ sở dữ liệu
require("./src/config/configMongoDB").connectDB(); // Kết nối với cơ sở dữ liệu MongoDB

// Định tuyến cho các endpoints
const authRoutes = require("./src/routes/authRoute"); // Import các routes cho music từ thư mục routes/music
app.use("/", authRoutes); // Sử dụng routes cho user


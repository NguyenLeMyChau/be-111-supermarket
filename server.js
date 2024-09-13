const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;
require("dotenv").config(); // Load các biến môi trường từ file .env

// npx nodemon server.js // Chạy server

// Định nghĩa một route cơ bản
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Khởi động server và lắng nghe trên port 4000
app.listen(PORT, () => {
    console.log(`Server đang chạy trên port ${PORT}`);
});

app.use(express.json()); // Sử dụng middleware để phân tích JSON gửi đến từ client
app.use(cors()); // Sử dụng middleware để xử lý lỗi CORS

// Kết nối tới cơ sở dữ liệu
require("./src/config/configMongoDB").connectDB(); // Kết nối với cơ sở dữ liệu MongoDB


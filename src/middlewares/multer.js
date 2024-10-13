const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'supermarket-111'); // Thư mục supermarket-111 sẽ tự động được tạo nếu chưa tồn tại 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Tên file sẽ được đặt theo ngày giờ upload 
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
const express = require('express');
const router = express.Router();
const multer = require("multer"); // Import thư viện multer để upload file
const AWS = require("aws-sdk"); // Import thư viện aws-sdk để sử dụng AWS S3
const path = require("path"); // Import thư viện path để xử lý đường dẫn file

// Khởi tạo AWS S3
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";

AWS.config.update({
    region: process.env.REGION,
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

const bucketName = process.env.S3_BUCKET_NAME;

// Cấu hình multer
const storage = multer.memoryStorage({
    destination(req, file, callback) {
        callback(null, "");
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 300000000 },
    fileFilter(req, file, cb) {
        checkFileType(file, cb);
    },
}).single("image");

function checkFileType(file, cb) {
    const fileTypes = /jpeg|jpg|png|mp4|mp3/; // Thêm các loại file mới vào regex
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    }
    return cb("Error: Images, Word, Excel, and PDF files only !!!");
}

const uploadImageS3 = async (req, res) => {
    try {
        // Gọi middleware multer ở đây để xử lý upload
        upload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    success: false,
                    message: "Lỗi trong quá trình upload ảnh",
                });
            } else if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Upload ảnh thất bại do lỗi không xác định",
                });
            }

            const avatar = req.file?.originalname.split("."); // Lấy tên file ảnh và tách ra để lấy loại file
            const fileType = avatar[avatar.length - 1]; // Lấy loại file từ tên file
            const filePath = `${Date.now().toString()}.${fileType}`;

            const paramsS3 = {
                Bucket: bucketName,
                Key: filePath,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            };
            console.log("Connecting to S3 with Bucket Name: ", bucketName);

            s3.upload(paramsS3, async (err, data) => {
                if (err) {
                    console.error("S3 Upload Error: ", err); // Log lỗi ra console
                    return res.status(500).json({
                        success: false,
                        message: "Upload ảnh thất bại",
                    });
                }
                const url = data.Location; // Lấy đường dẫn ảnh từ AWS S3 sau khi upload
                return res.status(200).json({
                    success: true,
                    message: "Upload ảnh thành công",
                    avatar: url,
                });
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi trong quá trình xử lý",
        });
    }
};

// Định nghĩa route POST cho việc upload ảnh
router.post('/upload-img-video', uploadImageS3);

module.exports = router;
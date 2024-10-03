const nodemailer = require('nodemailer');

// Tạo transporter với cấu hình SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
// Định nghĩa thông tin email
const mailOptions = {
    from: '"Your Name" <your-email@gmail.com>', // Địa chỉ gửi (tên hiển thị và email)
    to: 'recipient@example.com', // Địa chỉ người nhận
    subject: 'Subject of the email', // Tiêu đề email
    text: 'Hello, this is a plain text email!', // Nội dung email dạng văn bản
    html: '<b>Hello, this is a HTML email!</b>' // Nội dung email dạng HTML
};

// Gửi email
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log('Error while sending email:', error);
    }
    console.log('Email sent: ' + info.response);
});

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


// Hàm gửi email với thông tin đơn hàng

const sendOrderEmail = async (orderInfo) => {
    try {
        // Tạo nội dung email bao gồm thông tin đơn đặt hàng
        const mailOptions = {
            from: process.env.SMTP_USER, // Địa chỉ gửi
            to: 'no1xchau@gmail.com', // Email của nhà cung cấp
            subject: `[ĐƠN ĐẶT HÀNG] Đơn hàng từ CAPY SMART`, // Tiêu đề email
            html: `
                <h1>Thông tin đơn đặt hàng</h1>
                <p>Kính gửi: <strong>${orderInfo.supplierName}</strong></p>
                <p><strong>Người đặt hàng:</strong> CAPY SMART</p>
                <p><strong>Mã đơn hàng:</strong> ${orderInfo.orderId}</p>
                <p><strong>Số lượng sản phẩm:</strong> ${orderInfo.products.length}</p>
                <p><strong>Danh sách sản phẩm:</strong></p>
                <ul>
                    ${orderInfo.products.map(product => `
                        <li>
                            <strong>Tên sản phẩm:</strong> ${product.name} <br>
                            <strong>Số lượng:</strong> ${product.quantity} <br>
                            <strong>Giá nhập:</strong> ${product.price_order} VND
                        </li>
                    `).join('')}
                </ul>
                <p><strong>Tổng tiền:</strong> ${orderInfo.total} VND</p>
                <p>Kính mong quý công ty xác nhận đơn hàng, nếu có vấn đề gì, vui lòng liên hệ qua thông tin bên dưới</p>
                <p>Trân trọng!</p>
                <p>Đội ngũ CAPY SMART</p>
                <p><i>${orderInfo.senderName}</i></p>
                <p><i>${orderInfo.senderPhone}</i></p>
                <p><i>${orderInfo.senderEmail}</i></p>
            `,
        };

        // Gửi email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email đã được gửi: ' + info.response);
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
    }
};

module.exports = {
    sendOrderEmail
};

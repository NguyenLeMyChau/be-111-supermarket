const Account = require('../models/Account');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Danh sách vai trò hợp lệ
const VALID_ROLES = ['manager', 'customer', 'staff'];

async function registerAccount({ phone, password, role }) {
    try {
        // Kiểm tra vai trò hợp lệ
        if (!VALID_ROLES.includes(role)) {
            throw new Error('Invalid role provided');
        }

        // Kiểm tra xem tài khoản đã tồn tại chưa
        const existingAccount = await Account.findOne({ phone });
        if (existingAccount) {
            throw new Error('Account already exists');
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo tài khoản mới
        const newAccount = new Account({
            phone,
            password: hashedPassword,
            role, // Vai trò (role): 'customer', 'staft', 'manager'
            createdDate: Date.now(),
            updateDate: Date.now(),
            active: true
        });

        // Lưu tài khoản vào cơ sở dữ liệu
        await newAccount.save();

        return newAccount;
    } catch (err) {
        throw new Error(`Error registering account: ${err.message}`);
    }
}

// Hàm đăng nhập tài khoản
async function loginAccount({ phone, password }) {
    try {
        // Kiểm tra xem tài khoản có tồn tại không
        const account = await Account.findOne({ phone });
        if (!account) {
            throw new Error('Account does not exist');
        }

        // Kiểm tra mật khẩu
        const validPassword = await bcrypt.compare(password, account.password);
        if (!validPassword) {
            throw new Error('Invalid password');
        }

        // Kiểm tra xem tài khoản có bị vô hiệu hóa không
        if (!account.active) {
            throw new Error('Account is deactivated');
        }

        // Tạo JWT token với payload là id và vai trò của tài khoản
        const payload = {
           
                id: account._id,
                role: account.role, // role: 'Customer', 'Staff', 'Manager'
          
        };

        // Ký JWT token với thời hạn 1 giờ
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Trả về token và thông tin tài khoản
        return  token;
    } catch (err) {
        throw new Error(`Error logging in: ${err.message}`);
    }
}

module.exports = {
    registerAccount,
    loginAccount
};

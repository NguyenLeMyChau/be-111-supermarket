const Account = require('../models/Account');
const Employee = require('../models/Employee');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Danh sách vai trò hợp lệ
const VALID_ROLES = ['manager', 'customer', 'staff'];

// Đăng ký tài khoản
async function registerAccount(accountData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { phone, password, role, name, address, email, gender } = accountData;

        if (name === '' || phone === '' || password === '') {
            throw new Error('Vui lòng điền đầy đủ thông tin');
        }

        if (!VALID_ROLES.includes(role)) {
            throw new Error('Invalid role');
        }

        const existingAccount = await Account.findOne({ phone, role }).session(session);
        if (existingAccount) {
            throw new Error('Tài khoản đã tồn tại');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAccount = new Account({
            phone,
            password: hashedPassword,
            role,
            roleRef: role === 'customer' ? 'customer' : 'employee'
        });

        const savedAccount = await newAccount.save({ session });

        if (savedAccount.role === 'customer') {
            const newCustomer = new Customer({
                name,
                address: address || '',
                phone,
                email: email || '',
                gender,
                barcode: phone,
                account_id: savedAccount._id
            });

            const savedCustomer = await newCustomer.save({ session });

            await session.commitTransaction();
            session.endSession();

            return { newAccount: savedAccount, newUser: savedCustomer };

        } else {
            const newEmployee = new Employee({
                name,
                address,
                phone,
                email,
                gender,
                account_id: savedAccount._id
            });

            const savedEmployee = await newEmployee.save({ session });

            await session.commitTransaction();
            session.endSession();

            return { newAccount: savedAccount, newUser: savedEmployee };
        }

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw new Error(`Error registering account: ${err.message}`);
    }
}

// generate access token
function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_ACCESS_KEY, { expiresIn: '10h' });
}

// generate refresh token
function generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_KEY);
}

// Đăng nhập tài khoản
async function loginAccount({ phone, password }) {
    try {
        // Kiểm tra xem phone và password có được cung cấp không
        if (!phone || !password) {
            throw new Error('Vui lòng cung cấp số điện thoại và mật khẩu');
        }

        // Kiểm tra xem tài khoản có tồn tại không
        const account = await Account.findOne({ phone });
        const validPassword = await bcrypt.compare(password, account.password);
        if (!account || !validPassword) {
            throw new Error('Số điện thoại hoặc mật khẩu không chính xác');
        }

        // Kiểm tra xem tài khoản có bị vô hiệu hóa không
        if (!account.active) {
            throw new Error('Tài khoản đã bị vô hiệu hóa');
        }

        let user;
        if (account.role === 'customer') {
            user = await Customer.findOne({ account_id: account._id });
        } else {
            user = await Employee.findOne({ account_id: account._id });
        }

        if (!user) {
            throw new Error('Không tìm thấy thông tin người dùng');
        }


        // Tạo JWT token với payload là id và vai trò của tài khoản
        const payload = {
            id: account._id,
            role: account.role,
            user: {
                name: user.name,
                address: user.address,
                phone: user.phone,
                email: user.email,
                gender: user.gender,
                loyaltyPoints: user.loyaltyPoints
            },
        };

        // Ký JWT token với thời hạn 1 giờ
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Trả về token và thông tin account
        return { accessToken, refreshToken };

    } catch (err) {
        throw new Error(`Error logging in: ${err.message}`);
    }
}

async function getAllAccount() {
    try {
        const accounts = await Account.find();
        return accounts;
    } catch (err) {
        throw new Error(`Error getting all account: ${err.message}`);
    }
}

module.exports = {
    registerAccount,
    loginAccount,
    getAllAccount,
    generateAccessToken,
    generateRefreshToken
};

// services/authService.js
const Account = require('../models/Account');
const bcrypt = require('bcrypt');

async function registerAccount({ phone, password, role }) {
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
        role,
        createdDate: Date.now(),
        updateDate: Date.now(),
        active: true
    });

    // Lưu tài khoản vào cơ sở dữ liệu
    await newAccount.save();

    return newAccount;
}

async function loginAccount({ phone, password }) {
    // Kiểm tra xem tài khoản có tồn tại không
    const account = await Account.findOne({
        phone
    });

    if (!account) {
        throw new Error('Account does not exist');
    }

    // Kiểm tra password
    const validPassword = await bcrypt.compare(password, account.password);
    if (!validPassword) {
        throw new Error('Invalid password');
    }

    return account;
}

module.exports = {
    registerAccount,
    loginAccount
};
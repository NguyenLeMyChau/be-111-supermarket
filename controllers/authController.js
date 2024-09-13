const { registerAccount, loginAccount } = require('../services/authService');

// Đăng ký account
async function register(req, res) {
    try {
        const { phone, password, role } = req.body;
        const newAccount = await registerAccount({ phone, password, role });
        res.status(200).json(newAccount);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// Đăng nhập
async function login(req, res) {
    try {
        const { phone, password } = req.body;
        const token = await loginAccount({ phone, password });
        res.status(200).json({token});
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    register,
    login
};
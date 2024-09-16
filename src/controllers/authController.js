const { registerAccount, loginAccount, getAllAccount, generateAccessToken, generateRefreshToken } = require('../services/authService');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
let refreshTokens = []; // Lưu trữ refresh token

// Đăng ký account
async function register(req, res) {
    try {
        const { newAccount, newUser } = await registerAccount(req.body);
        res.status(200).json({ account: newAccount, user: newUser });
    } catch (error) {
        console.error(`Error registering account: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

// Đăng nhập
async function login(req, res) {
    try {
        const { phone, password } = req.body;
        const { accessToken, refreshToken } = await loginAccount({ phone, password });
        refreshTokens.push(refreshToken);
        // Gửi refresh token về client trong cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'strict',
        });

        // Trả về token và thông tin account
        res.status(200).json({ accessToken });
    } catch (error) {
        console.error(`Error logging in: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

// refresh token
async function requestRefreshToken(req, res) {
    try {
        // Lấy refresh token từ cookie
        const refreshToken = req.cookies.refreshToken;

        // Kiểm tra xem refresh token có được cung cấp không
        if (!refreshToken) {
            return res.status(403).json({ message: 'No refresh token provided' });
        }

        if (!refreshTokens.includes(refreshToken)) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // Giải mã refresh token để lấy thông tin account
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);

        const account = {
            id: payload.id,
            role: payload.role,
        };

        // Tạo token mới
        const newAccessToken = generateAccessToken(account);
        const newRefreshToken = generateRefreshToken(account);

        // Xóa refresh token cũ khỏi danh sách refresh token 
        refreshTokens = refreshTokens.filter(token => token !== refreshToken);

        // Thêm refresh token mới vào danh sách
        refreshTokens.push(newRefreshToken);

        // Gửi refresh token về client trong cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'strict',
        });

        // Trả về token và thông tin account
        res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });

    } catch (error) {
        console.error(`Error refreshing token: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

//LOGOUT
async function logout(req, res) {
    try {
        // Lấy refresh token từ cookie
        const refreshToken = req.cookies.refreshToken;

        // Xóa refresh token khỏi danh sách refresh token
        refreshTokens = refreshTokens.filter(token => token !== refreshToken);

        // Xóa cookie chứa refresh token
        res.clearCookie('refreshToken');

        res.status(200).json({ message: 'Logout successfully' });
    } catch (error) {
        console.error(`Error logging out: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}


// Lấy toàn bộ danh sách account
async function getAccounts(req, res) {
    try {
        const accounts = await getAllAccount();
        res.status(200).json(accounts);
    } catch (error) {
        console.error(`Error getting accounts: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    register,
    login,
    logout,
    getAccounts,
    requestRefreshToken
};
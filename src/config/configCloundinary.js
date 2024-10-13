const cloundinary = require('cloudinary').v2;

const configCloundinary = () => {
    cloundinary.config({
        cloud_name: process.env.CLOUNDINARY_CLOUD_NAME,
        api_key: process.env.CLOUNDINARY_API_KEY,
        api_secret: process.env.CLOUNDINARY_API_SECRET
    });
};

module.exports = configCloundinary;
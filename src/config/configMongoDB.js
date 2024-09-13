const mongoose = require('mongoose');

require('dotenv').config();

console.log(process.env.MONGODB_URL);

exports.connectDB = () => {
    mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => console.log("MongoDB Connected Successfully"))
        .catch((error) => {
            console.log("this error occured" + error);
            process.exit(1);
        })
};
const express = require('express');
const router = express.Router();
const axios = require('axios').default; // npm install axios
const CryptoJS = require('crypto-js'); // npm install crypto-js
const moment = require('moment'); // npm install moment
const qs = require('qs')
require('dotenv').config(); // Đọc biến môi trường từ .env

// APP INFO
const config = {
    app_id: process.env.ZALOPAY_APP_ID,
    key1: process.env.ZALOPAY_KEY1,
    key2: process.env.ZALOPAY_KEY2,
    endpoint: process.env.ZALOPAY_ENDPOINT
};

router.post('/payment', async (req, res) => {
    const embed_data = {
        redirecturl: `${process.env.CLIENT_URL}/frame-staff/payment`,
    };
    let amountPay = req.body.amount;
    const items = [{}];
    const transID = Math.floor(Math.random() * 1000000);
    const order = {
        app_id: config.app_id,
        app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
        app_user: "user123",
        app_time: Date.now(), // miliseconds
        item: JSON.stringify(items),
        embed_data: JSON.stringify(embed_data),
        amount: amountPay,
        description: `Capy - thanh toán hóa đơn #${transID}`,
        bank_code: "",
        // callback_url: "https://6796-171-252-189-212.ngrok-free.app/api/zalo-pay/callback"
         callback_url: `${process.env.URL_CALLBACK}/api/zalo-pay/callback`,
        //  callback_url: "https://1c7b-116-111-184-13.ngrok-free.app/api/zalo-pay/callback"

    };

    // appid|app_trans_id|appuser|amount|apptime|embeddata|item
    const data = config.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    try {
        const result = await axios.post(config.endpoint, null, { params: order });
        return res.status(200).json(result.data);

    } catch (error) {
        console.log('Lỗi khi thanh toán zalo pay: ', error.message);
    }
});

//API đối tác xây dựng sẽ nhận kết quả thanh toán từ ZaloPay. 
//Khi và chỉ khi ZaloPay đã thu tiền khách hàng thành công thì mới gọi API này để thông báo kết quả.

router.post('/callback', (req, res) => {
    let result = {};

    try {
        let dataStr = req.body.data;
        let reqMac = req.body.mac;

        let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
        console.log("mac =", mac);


        // kiểm tra callback hợp lệ (đến từ ZaloPay server)
        if (reqMac !== mac) {
            // callback không hợp lệ
            result.return_code = -1;
            result.return_message = "mac not equal";
        }
        else {
            // thanh toán thành công
            // merchant cập nhật trạng thái cho đơn hàng
            let dataJson = JSON.parse(dataStr, config.key2);
            console.log("update order's status = success where app_trans_id =", dataJson["app_trans_id"]);

            result.return_code = 1;
            result.return_message = "success";
        }
    } catch (ex) {
        result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
        result.return_message = ex.message;
    }

    // thông báo kết quả cho ZaloPay server
    res.json(result);
});

router.post('/order-status/:app_trans_id', async (req, res) => {
    const app_trans_id = req.params.app_trans_id;
    let postData = {
        app_id: config.app_id,
        app_trans_id: app_trans_id, // Input your app_trans_id
    }

    let data = postData.app_id + "|" + postData.app_trans_id + "|" + config.key1; // appid|app_trans_id|key1
    postData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();


    let postConfig = {
        method: 'post',
        url: 'https://sb-openapi.zalopay.vn/v2/query',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify(postData)
    };

    try {
        const result = await axios(postConfig);
        return res.status(200).json(result.data);
    } catch (error) {
        console.log(error.message);
    }
});
module.exports = router;


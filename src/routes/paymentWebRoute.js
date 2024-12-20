const axios = require("axios");

const router = require("express").Router();
const qs = require("qs");
const CryptoJS = require("crypto-js"); // npm install crypto-js
const moment = require("moment"); // npm install moment

const config = {
  app_id: "2553",
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
  endpointCheck: "https://sb-openapi.zalopay.vn/v2/query",
};
const createOrder = (amount, embed_data, transID) => {
  const items = [{}];
  return {
    app_id: config.app_id,
    app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
    app_user: "user123",
    app_time: Date.now(),
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount: amount || 10000,
    description: `Thanh toán hóa đơn CapySmart #${transID}`,
    bank_code: "zalopayapp",
    callback_url: `${process.env.URL_CALLBACK}/api/payment/callback`,
  };
};
router.post("/payment", async (req, res) => {
  const { amount } = req.body;
  const transID = Math.floor(Math.random() * 1000000);
  const embed_data = {
    redirecturl: `${process.env.CLIENT_URL}/frame-staff/payment`, // Redirect về trang web
  };

  const order = createOrder(amount, embed_data, transID);
  console.log(order)
  const data = `${config.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
  order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();
console.log(order.mac)
  try {
    const result = await axios.post(config.endpoint, null, { params: order });
    return res.status(200).json({ 
      data: result.data, 
      app_trans_id: order.app_trans_id 
    });
    
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
});
router.post("/paymentapp", async (req, res) => {
  const { amount } = req.body;
  const transID = Math.floor(Math.random() * 1000000);
  const embed_data = {
   
  };

  const order = createOrder(amount, embed_data, transID);
  const data = `${config.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
  order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

  try {
    const result = await axios.post(config.endpoint, null, { params: order });
    // Trả về URL thanh toán cho app
    return res.status(200).json({ paymentUrl: result.data,app_trans_id: order.app_trans_id  });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
});
// router.post("/payment", async (req, res) => {
//   const { amount } = req.body;
//   const embed_data = {
//     redirecturl: `${process.env.CLIENT_URL}/order`,
//     // redirecturl: process.env.URL_EXPO,
//   };

//   const items = [{}];
//   const transID = Math.floor(Math.random() * 1000000);
//   const order = {
//     app_id: config.app_id,
//     app_trans_id: `${moment().format("YYMMDD")}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
//     app_user: "user123",
//     app_time: Date.now(), // miliseconds
//     item: JSON.stringify(items),
//     embed_data: JSON.stringify(embed_data),
//     amount: amount || 10000,
//     description: `TD Cinemas - Thanh toán đơn hàng #${transID}`,
//     bank_code: "zalopayapp",
//     callback_url: `${process.env.URL_CALLBACK}/api/callback`,
//   };

//   // appid|app_trans_id|appuser|amount|apptime|embeddata|item
//   const data =
//     config.app_id +
//     "|" +
//     order.app_trans_id +
//     "|" +
//     order.app_user +
//     "|" +
//     order.amount +
//     "|" +
//     order.app_time +
//     "|" +
//     order.embed_data +
//     "|" +
//     order.item;
//   order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

//   try {
//     const result = await axios.post(config.endpoint, null, { params: order });
//     console.log("-------------------Success-----------------");
//     return res.status(200).json(result.data);
//   } catch (error) {
//     return res.status(500).json({
//       statusCode: 500,
//       message: "Internal Server Error",
//     });
//   }
// });

router.post("/callback", async (req, res) => {
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
    } else {
      // thanh toán thành công
      // merchant cập nhật trạng thái cho đơn hàng
      let dataJson = JSON.parse(dataStr, config.key2);
      console.log(
        "update order's status = success where app_trans_id =",
        dataJson["app_trans_id"]
      );

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
router.post("/order-status/:app_tran_id", async (req, res) => {
  const { app_tran_id } = req.params;

  let postData = {
    app_id: config.app_id,
    app_trans_id: app_tran_id, // Input your app_trans_id
  };

  let data = postData.app_id + "|" + postData.app_trans_id + "|" + config.key1; // appid|app_trans_id|key1
  postData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

  let postConfig = {
    method: "post",
    url: config.endpointCheck,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: qs.stringify(postData),
  };

  try {
    const result = await axios(postConfig);
    console.log("-------------------Success Check Order-----------------");
    console.log(result.data);
    return res.status(200).json(result.data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
});
module.exports = router;

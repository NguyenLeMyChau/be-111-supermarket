// controllers/productPriceController.js
const priceService = require('../services/priceService');

const getAllProductPrice = async (req, res) => {
  try {
    const productPriceHeaders = await priceService.getAllProductPrice();
    res.status(200).json(productPriceHeaders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
    getAllProductPrice,
};

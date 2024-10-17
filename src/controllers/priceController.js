// controllers/productPriceController.js
const priceService = require('../services/priceService');

const getAllProductPrice = async (req, res) => {
  try {
    const productPriceHeaders = await priceService.getAllProductPrices();
    res.status(200).json(productPriceHeaders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addProductPrice = async (req, res) => {
  const { description, startDate, endDate, status } = req.body;
  try {
    const newProductPrice = await priceService.addProductPrice({
      description,
      startDate,
      endDate,
      status
    });

    res.status(201).json(newProductPrice);
  } catch (error) {
    console.error('Error adding product price:', error);
    res.status(500).json({ message: 'Failed to add product price.' });
  }
};
const updateProductPrice = async (req, res) => {
  const { priceId } = req.params;
  const { description, startDate, endDate, status } = req.body;

  try {
    // Call the service layer to update the product price
    const { updatedPrice, messages } = await priceService.updateProductPrice(priceId, { description, startDate, endDate, status });

    if (!updatedPrice) {
      return res.status(404).json(messages);
    }

    // Return the updated price along with success messages
    res.status(200).json({ updatedPrice, messages });
  } catch (error) {
    console.error('Error updating product price:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const addProductPriceDetail = async (req, res) => {
  const { productPriceHeader_id, product_id, price } = req.body;

  try {
      // Call the service layer to add the product price detail
      const newPriceDetail = await priceService.addProductPriceDetail({
          productPriceHeader_id,
          product_id,
          price
      });

      res.status(201).json(newPriceDetail);
  } catch (error) {
      console.error('Error adding product price detail:', error);
      res.status(500).json({ message: 'Failed to add product price detail.' });
  }
};
const updateProductPriceDetail = async (req, res) => {
  const { priceDetailid } = req.params;
  const { productPriceHeader_id, product_id, price } = req.body;

  try {
    const updatedPriceDetail = await priceService.updatePriceDetail(priceDetailid, {
      productPriceHeader_id,
      product_id,
      price
    });

    if (!updatedPriceDetail) {
      return res.status(404).json({ message: 'Product price detail not found' });
    }

    res.status(200).json(updatedPriceDetail);
  } catch (error) {
    console.error('Error updating product price detail:', error);
    res.status(500).json({ message: 'Failed to update product price detail.' });
  }
};


async function getProductsWithoutPrice(req, res) {
  const { productPriceHeader_id } = req.query;
    try {
      console.log(productPriceHeader_id)
        const products = await priceService.getProductsWithoutPriceAndActivePromotion(productPriceHeader_id);
        res.status(200).json(products);
    } catch (error) {
        console.error(`Lỗi khi lấy sản phẩm không có giá: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}
module.exports = {
    getAllProductPrice,
    addProductPrice,
    updateProductPrice,
    addProductPriceDetail,
    updateProductPriceDetail,
    getProductsWithoutPrice
};

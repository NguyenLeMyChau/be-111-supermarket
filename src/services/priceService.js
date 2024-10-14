const ProductPriceHeader = require("../models/ProductPrice_Header");
const ProductPriceDetail = require("../models/ProductPrice_Detail");
const Product = require("../models/Product");

async function getAllProductPrices() {
  try {
    const productPriceHeaders = await ProductPriceHeader.find();
    const productPricesWithDetails = await Promise.all(
      productPriceHeaders.map(async (header) => {
        const productPriceDetails = await ProductPriceDetail.find({
          productPriceHeader_id: header._id,
        });

       
        const detailedProductPrices = await Promise.all(
          productPriceDetails.map(async (detail) => {
            const product = await Product.findById(detail.product_id);
            return {
              ...detail.toObject(),
              product: product ? product.toObject() : null,
            };
          })
        );

        return {
          ...header.toObject(),
          productPrices: detailedProductPrices,
        };
      })
    );
    console.log(productPricesWithDetails)
    return productPricesWithDetails;
  } catch (err) {
    throw new Error(`Error fetching product prices: ${err.message}`);
  }
}

module.exports = {
  getAllProductPrices,
};

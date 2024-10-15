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
       return productPricesWithDetails;
  } catch (err) {
    throw new Error(`Error fetching product prices: ${err.message}`);
  }
}
const addProductPrice = async (productPriceData) => {
  const { description, startDate, endDate, status } = productPriceData;

  try {
    // Step 1: Find the active ProductPriceHeader
    const activeHeader = await ProductPriceHeader.findOne({ status: 'active' });
    if (!activeHeader) {
      throw new Error('No active ProductPriceHeader found.');
    }

    // Step 2: Get all ProductPriceDetails for the active header
    const activePriceDetails = await ProductPriceDetail.find({
      productPriceHeader_id: activeHeader._id,
    });

    // Step 3: Create the new ProductPriceHeader
    const newProductPrice = new ProductPriceHeader({
      description,
      startDate,
      endDate,
      status,
    });
    const savedHeader = await newProductPrice.save();

    // Step 4: Copy the ProductPriceDetails to the new header
    const newPriceDetails = activePriceDetails.map((detail) => ({
      productPriceHeader_id: savedHeader._id,
      product_id: detail.product_id,
      price: detail.price,
    }));

    // Save all new ProductPriceDetail records
    await ProductPriceDetail.insertMany(newPriceDetails);

    return savedHeader;
  } catch (error) {
    throw new Error('Error adding product price: ' + error.message);
  }
};

const updateProductPrice = async (priceId, updateData) => {
  const messages = []; // Array to hold messages for feedback

  try {
    // Find the existing product price
    const existingPrice = await ProductPriceHeader.findById(priceId);

    // Check if the product price exists
    if (!existingPrice) {
      messages.push('Product price not found.');
      return { updatedPrice: null, messages };
    }

    // Check if status is being updated to 'inactive'
    if (existingPrice.status !== updateData.status && updateData.status === 'inactive') {
      const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
      const existingPriceEndDate = new Date(existingPrice.endDate).toISOString().slice(0, 10); 
      // Check if the endDate is today
      if (existingPriceEndDate === today) {
        // Check for any records with startDate equal to today
        const todayStartRecords = await ProductPriceHeader.find({ startDate: today });

        if (todayStartRecords.length > 0) {
          await ProductPriceHeader.updateMany(
            { startDate: today },
            { $set: { status: 'active' } }
          );
          messages.push('Updated status of records starting today to active.'); // Message for updating status
        } else {
          messages.push('No records found with start date today, so status cannot be updated.'); // Message if no records found
          return { updatedPrice: null, messages }; // Return without updating
        }
      } else {
        messages.push('The end date is not today, so status cannot be updated.'); // Message if endDate is not today
       
        return { updatedPrice: null, messages }; // Return without updating
      }
    }

    if (existingPrice.status !== updateData.status) {
      messages.push(`Status is being updated from ${existingPrice.status} to ${updateData.status}`); // Log status change
    }

    // Update the product price with the new data
    const updatedPrice = await ProductPriceHeader.findByIdAndUpdate(
      priceId,
      updateData,
      { new: true, runValidators: true }
    );

    messages.push('Product price updated successfully.'); // Message for successful update
    return { updatedPrice, messages }; // Return updated price and messages
  } catch (error) {
    messages.push('Error updating product price: ' + error.message); // Capture error message
    return { updatedPrice: null, messages }; // Return null and messages in case of error
  }
};


const addProductPriceDetail = async (priceDetailData) => {
  const { productPriceHeader_id, product_id, price } = priceDetailData;

  try {
      const headerExists = await ProductPriceHeader.findById(productPriceHeader_id);
      if (!headerExists) {
          throw new Error(`ProductPriceHeader with ID ${productPriceHeader_id} does not exist.`);
      }

      const newProductPriceDetail = new ProductPriceDetail({
          productPriceHeader_id,
          product_id,
          price
      });

      return await newProductPriceDetail.save();
  } catch (error) {
      throw new Error('Error adding product price detail: ' + error.message);
  }
};

const updatePriceDetail = async (priceDetailid, updateData) => {
  const { productPriceHeader_id, product_id, price } = updateData;
  try {
    // Check if the ProductPriceHeader exists
    const headerExists = await ProductPriceHeader.findById(productPriceHeader_id);
    if (!headerExists) {
      throw new Error(`ProductPriceHeader with ID ${productPriceHeader_id} does not exist.`);
    }

    // Find the ProductPriceDetail by ID and update it with the new data
    const updatedPriceDetail = await ProductPriceDetail.findByIdAndUpdate(
      priceDetailid,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPriceDetail) {
      throw new Error(`ProductPriceDetail with ID ${priceDetailid} does not exist.`);
    }

    return updatedPriceDetail;
  } catch (error) {
    throw new Error('Error updating product price detail: ' + error.message);
  }
};
module.exports = {
  getAllProductPrices,
  addProductPrice,
  updateProductPrice,
  addProductPriceDetail,
  updatePriceDetail,
};

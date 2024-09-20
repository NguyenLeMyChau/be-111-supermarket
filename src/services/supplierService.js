const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

async function getAllSupplier() {
    try {
        const suppliers = await Supplier.find();

        const suppliersWithProducts = await Promise.all(suppliers.map(async (supplier) => {
            const products = await Product.find({ supplier_id: supplier._id });
            return {
                ...supplier.toObject(),
                products: products,
            };
        }));

        return suppliersWithProducts;
    } catch (err) {
        throw new Error(`Error getting all account: ${err.message}`);
    }
}

module.exports = {
    getAllSupplier,
};
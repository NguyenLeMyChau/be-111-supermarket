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

async function addSupplier(supplierData) {
    try {
        const newSupplier = new Supplier(supplierData);
        await newSupplier.save();
        return newSupplier;
    } catch (err) {
        throw new Error(`Error adding supplier: ${err.message}`);
    }
}

async function updateSupplier(supplierId, supplierData) {
    try {
        const updatedSupplier = await Supplier.findByIdAndUpdate(supplierId, supplierData, { new: true });
        return updatedSupplier;
    } catch (err) {
        throw new Error(`Error updating supplier: ${err.message}`);
    }

}

module.exports = {
    getAllSupplier,
    addSupplier,
    updateSupplier,
};
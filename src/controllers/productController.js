const { getAllCategory, getAllProduct, getProductsBySupplierId } = require("../services/productService");


async function getCategories(req, res) {
    try {
        const categories = await getAllCategory();
        res.status(200).json(categories);
    } catch (error) {
        console.error(`Error get categories: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function getProducts(req, res) {
    try {
        const products = await getAllProduct();
        res.status(200).json(products);
    } catch (error) {
        console.error(`Error get products: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function findProductBySupplierId(req, res) {
    try {
        const { supplierId } = req.params;
        const products = await getProductsBySupplierId(supplierId);
        res.status(200).json(products);
    } catch (error) {
        console.error(`Error get products: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}
module.exports = {
    getCategories,
    getProducts,
    findProductBySupplierId
};
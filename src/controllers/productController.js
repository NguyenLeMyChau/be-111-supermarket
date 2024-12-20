const { getAllCategory, getAllProduct, getProductsBySupplierId, getProductsDetail, addCategory, updateCategory, addProductWithWarehouse, updateProduct, getAllProductsWithPriceAndPromotion, getAllProductsWithPriceAndPromotionNoCategory, getProductsByBarcodeInUnitConvert, getAllCategoryWithPrice, deleteCategory } = require("../services/productService");


async function getCategories(req, res) {
    try {
        const categories = await getAllCategoryWithPrice();
        res.status(200).json(categories);
    } catch (error) {
        console.error(`Error get categories: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

const deleteCategoryController = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await deleteCategory(categoryId);
        res.status(200).json(category);
    } catch (error) {
        console.error(`Error delete category: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function addCategoryController(req, res) {
    try {
        const categoryData = req.body;
        const category = await addCategory(categoryData);
        res.status(200).json(category);
    } catch (error) {
        console.error(`Error add category: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function updateCategoryController(req, res) {
    try {
        const { categoryId } = req.params;
        const categoryData = req.body;
        const category = await updateCategory(categoryId, categoryData);
        res.status(200).json(category);
    } catch (error) {
        console.error(`Error update category: ${error.message}`);
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

async function getProductsDetailController(req, res) {
    try {
        const productId = req.params.productId;
        const product = await getProductsDetail(productId);
        res.status(200).json(product);
    } catch (error) {
        console.error(`Error get product detail: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

const addProductWithWarehouseController = async (req, res) => {
    try {
        const productData = req.body;
        const product = await addProductWithWarehouse(productData);
        res.status(200).json(product);
    } catch (error) {
        console.error(`Error add product: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

const updateProductController = async (req, res) => {
    try {
        const { productId } = req.params;
        const productData = req.body;
        const product = await updateProduct(productId, productData);
        res.status(200).json(product);
    } catch (error) {
        console.error(`Error update product: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}
async function getProductsWithPriceAndPromotion(req, res) {
    try {
        const products = await getAllProductsWithPriceAndPromotion();
        res.status(200).json(products);
    } catch (error) {
        console.error(`Error get products with price and promotions: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function getAllProductsWithPriceAndPromotionNoCategoryController(req, res) {
    try {
        const products = await getAllProductsWithPriceAndPromotionNoCategory();
        res.status(200).json(products);
    } catch (error) {
        console.error(`Error get products with price and promotions: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}
async function getProductsByBarcodeInUnitConvertController(req, res) {
    try {
        const { barcode } = req.body;

        const products = await getProductsByBarcodeInUnitConvert(barcode);
        res.status(200).json(products);
    } catch (error) {
        console.error(`Error get products with price and promotions: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getCategories,
    deleteCategoryController,
    addCategoryController,
    updateCategoryController,
    getProducts,
    findProductBySupplierId,
    getProductsDetailController,
    addProductWithWarehouseController,
    updateProductController,
    getProductsWithPriceAndPromotion,
    getAllProductsWithPriceAndPromotionNoCategoryController,
    getProductsByBarcodeInUnitConvertController
};
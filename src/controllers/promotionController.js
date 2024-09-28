const { getAllPromotion } = require("../services/promotionServices");

async function getPromotions(req, res) {
    try {
        const promotions = await getAllPromotion();
        res.status(200).json(promotions);
    } catch (error) {
        console.error(`Error get products: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}
module.exports = {
    getPromotions
};
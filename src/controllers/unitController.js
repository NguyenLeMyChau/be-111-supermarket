const unitService = require('../services/unitService');

// Lấy tất cả các Units
const getAllUnits = async (req, res) => {
    try {
        const units = await unitService.getAllUnits();
        return res.status(200).json(units);
    } catch (error) {
        console.error('Failed to get units:', error);
        return res.status(500).json({ message: 'Failed to get units', error: error.message });
    }
};

module.exports = {
    getAllUnits,
};

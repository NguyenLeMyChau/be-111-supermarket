const Unit = require('../models/Unit');

// Lấy tất cả Units
const getAllUnits = async () => {
    try {
        return await Unit.find({});
    } catch (error) {
        throw new Error('Error fetching units: ' + error.message);
    }
};

module.exports = {
    getAllUnits,
};

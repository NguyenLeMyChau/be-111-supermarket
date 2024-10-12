const Unit = require('../models/Unit');

// Lấy tất cả Units
const getAllUnits = async () => {
    try {
        return await Unit.find({});
    } catch (error) {
        throw new Error('Error fetching units: ' + error.message);
    }
};

const getUnitById = async (unitId) => {
    try {
        const unit = await Unit.findById(unitId);
        if (!unit) {
            throw new Error('Unit not found');
        }

        return unit;
    } catch (error) {
        throw new Error('Error fetching units: ' + error.message);
    }
}

module.exports = {
    getAllUnits,
    getUnitById
};

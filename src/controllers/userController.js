const { updateUser } = require("../services/userService");

async function updateUserController(req, res) {
    const { accountId } = req.params;
    const userData = req.body;
    try {
        const userUpdated = await updateUser(accountId, userData);
        res.status(200).json(userUpdated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = {
    updateUserController
};
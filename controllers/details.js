const User = require('../models/create');

exports.details = async (req, res, next) =>{
    try {
        const predictions = await User.findOne({_id: req.params._id})
        return res.status(200).json({
            result: predictions,
            message: "Tickt found"
        });
    } catch (error) {
        next(error)
    }
}
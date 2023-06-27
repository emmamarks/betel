const Ticket = require('../models/create');

exports.details = async (req, res, next) =>{
    try {
        const predictions = await Ticket.findOne({_id: req.params._id})
        return res.status(200).json({
            result: predictions,
            message: "Ticket found"
        });
    } catch (error) {
        next(error)
    }
}
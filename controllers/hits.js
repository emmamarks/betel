const templateCopy = require('../models/create');

exports.hits = async (req, res, next) =>{
    try {
        const predictions = await templateCopy.find({ paid2: "false" }).
        populate({ path: "author" })
        return res.status(200).json({
            result: predictions
        });
    } catch (error) {
        next(error)
    }
}
const templateCopy = require('../models/create');

exports.trending = async (req, res, next) =>{
    try {
        const predictions = await templateCopy.find({ paid2: "true" }).
        populate({ path: "author" })
        return res.status(200).json({
            result: predictions
        });
    } catch (error) {
        next(error)
    }
}
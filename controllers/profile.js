const posts = require('../models/create');

exports.profile = async (req, res, next) =>{
    try {
        const predictions = await posts.find({ author: req.params.author }).
        populate({ path: "author" })
        return res.status(200).json({
            result: predictions
        });
    } catch (error) {
        next(error)
    }
}; 
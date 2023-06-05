const posts = require('../models/create');

exports.profile = async (req, res, next) =>{
    try {
        const predictions = await posts.find({ author: "646e138731854322145980c9" }).
        populate({ path: "author" })
        console.log(predictions);
        return res.status(200).json({
            result: predictions
        });
    } catch (error) {
        next(error)
    }
}; 
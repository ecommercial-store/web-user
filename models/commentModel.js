const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    email: { type: String, require: true },
    comment: { type: String, required: false },
    rating: { type: Number, required: true },
    createTime: { type: Date, required: true }
});

module.exports = mongoose.model('Comment', commentSchema);
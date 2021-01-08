const express = require('express');
const router = express();
const Comment = require('../models/commentModel');
const Pusher = require('pusher');
const pusher = new Pusher({
    appId: process.env.PUSHER_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    encrypted: true
});
router.post('/comment', async(req, res, next) => {
    if (req.body.rating == "" || req.body.rating == 0) {
        req.body.rating = 1;
    }
    const newComment = {
        productId: req.body.productId,
        name: req.body.name,
        email: req.body.email,
        comment: req.body.comment,
        rating: req.body.rating,
        userImage: req.body.userImage
    }
    const comment = new Comment({
        productId: req.body.productId,
        name: req.body.name,
        email: req.body.email,
        comment: req.body.comment,
        userImage: req.body.userImage,
        rating: req.body.rating,
        createTime: new Date()
    });
    const save_comment = await comment.save();
    pusher.trigger(process.env.PUSHER_NAME_APP, process.env.PUSHER_COMMENT_NAME, newComment);
    res.json({ created: true });
});

module.exports = router;
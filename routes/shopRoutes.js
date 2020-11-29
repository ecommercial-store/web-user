const express = require('express');
const shopController = require('../controllers/shopController');
const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', shopController.getCart);

router.post('/cart', shopController.postCart);

router.post('/cart-delete-item', shopController.postDeleteCartItem);

router.get('/login', shopController.getSignIn);

router.get('/register', shopController.getRegister);



module.exports = router;
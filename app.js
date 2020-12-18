const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const MongoDBStore = require('connect-mongodb-session')(session);
const passport = require('passport');

const shopRoutes = require('./routes/shopRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./controllers/errorController');
const User = require('./models/userModel');

const MONGODB_URL = 'mongodb+srv://admin:admincoza@cluster0.cjf9m.mongodb.net/coza-db';
const store = new MongoDBStore({
    uri: MONGODB_URL,
    collection: 'sessions'
});

require('./config/passport');

//storage image for user
const imageStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images/user');
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    }
});
const imageFilter = (req, file, callback) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        callback(null, true);
    } else {
        callback(null, false);
    }
};

app.use(passport.initialize());
app.use(passport.session());
app.use(multer({ storage: imageStorage, fileFilter: imageFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'coza secret', resave: false, saveUninitialized: false, store: store }));
app.use(flash());


app.use((req, res, next) => {
    if (!req.session.passport) {
        return next();
    }
    User.findById(req.session.passport.user)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => console.log(err));
});

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(shopRoutes);

app.use(authRoutes);

app.use(errorHandler.render404Page);


mongoose
    .connect(MONGODB_URL)
    .then(result => {
        app.listen(process.env.PORT || 3000);
        console.log('Connected to Database');
    })
    .catch(err => console.log(err));
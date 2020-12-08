const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator/check');

const User = require('../models/userModel');

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'adcoza123@gmail.com',
        pass: 'buikhacTri123'
    }
});


//render trang dang nhap
exports.getLogIn = (req, res, next) => {
    res.render('auth/login', {
        pageTitle: 'Log in',
        path: '/login',
        errorMessage: '',
        oldInput: {
            email: '',
            password: ''
        },
        validationCond: []
    });
};

//xu ly an dang nhap
exports.postLogIn = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    pageTitle: 'Login',
                    path: '/login',
                    errorMessage: 'Invalid email',
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    validationCond: 'email'
                });
            }
            bcrypt
                .compare(password, user.password)
                .then(equal => {
                    if (equal) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect('/')
                        })
                    }
                    return res.status(422).render('auth/login', {
                        pageTitle: 'Login',
                        path: '/login',
                        errorMessage: 'Incorrect password',
                        oldInput: {
                            email: email,
                            password: password,
                        },
                        validationCond: 'password'
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                });
        })
        .catch(err => console.log(err));
};

//xu ly an dang xuat
exports.postLogOut = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    })
};

//render trang dang ky
exports.getRegister = (req, res, next) => {
    res.render('auth/register', {
        pageTitle: 'Register',
        path: '/register',
        errorMessage: message,
        oldInput: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        validationCond: []
    })
};

//xu ly an dang ky
exports.postRegister = (req, res, next) => {
    const name = req.body.name
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req); //nhan error tra ve

    if (!errors.isEmpty()) {
        return res.status(422).render('auth/register', {
            pageTitle: 'Register',
            path: '/register',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                name: name,
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationCond: errors.array()[0]
        });
    }

    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                name: name,
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(result => {
            console.log('Created new user');
            const msg = {
                from: 'Coza Store Authentication',
                to: email,
                subject: 'SIGN UP COZA STORE',
                html: `
                <h4>Hi ${name}</h4>
                <p style="margin-top: 30px;">Welcome to Big Coza Family.<br>Click the button below to shop now</p>
                <a style="background: #111;
                    height: 60px;
                    padding: 10px 43px;
                    border: 0;
                    color: #fff;
                    text-transform: capitalize;
                    cursor: pointer;
                    font-size: 16px;
                    border-radius: 0px;
                    margin-left: 100px;
                    text-decoration:none;" href="http://localhost:3000">Go to store</a>
                <p style="margin-top: 40px;">Thanks.<br>Admin Coza Store</p>
                `
            };
            return transporter
                .sendMail(msg)
                .catch(err => console.log(err));
        })
        .then(result => {
            return res.redirect('/login');
        })
        .catch(err => console.log(err));
};

//render trang nhap email lay lai mk
exports.getResetForm = (req, res, next) => {
    res.render('auth/reset', {
        pageTitle: 'Reset password',
        path: '/reset',
        errorMessage: '',
    });
};

//xu ly gui mail de xac nhan lay lai mk
exports.postResetForm = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/reset', {
            pageTitle: 'Reset Password',
            path: '/reset',
            errorMessage: errors.array()[0].msg,
        });
    }
    let userInfo;
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                userInfo = user
                if (!user) {
                    //flash later here
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiredTime = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                console.log('Submit email to reset password');
                const msg = {
                    from: 'Coza Store Authentication',
                    to: req.body.email,
                    subject: 'PASSWORD RESET',
                    html: `
                    <h4>Hi ${userInfo.name}</h4>
                    <p style="margin-bottom: 30px;">You recently request to reset your password for your Coza Store account.<br> Click the button below to reset it</p>
                    <a style="background: #111;
                        height: 60px;
                        padding: 10px 43px;
                        border: 0;
                        color: #fff;
                        text-transform: capitalize;
                        cursor: pointer;
                        font-size: 16px;
                        border-radius: 0px;
                        margin-left: 100px;
                        text-decoration:none;" href="http://localhost:3000/reset/${token}">Reset your password</a>
                    <p style="margin-top:30px">If you did not request a password reset, please ignore this email.<br>This password reset is only valid for the next 1 hour</p>
                    <p style="margin-top: 40px;">Thanks.<br>Admin Coza Store</p>

                    `
                };
                return transporter
                    .sendMail(msg)
                    .catch(err => console.log(err));
            })
            .then(result => {
                res.redirect('/login');
            })
            .catch(err => console.log(err));
    })
};

//render trang doi mk
exports.getResetPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiredTime: { $gt: Date.now() } })
        .then(user => {
            res.render('auth/reset-password', {
                pageTitle: 'New password',
                path: '/reset-password',
                userId: user._id.toString(),
                passwordToken: token,
                errorMessage: ''
            });
        })
        .catch(err => console.log(err));
};

//cap nhat mat khau moi
exports.postResetPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const pswdtoken = req.body.passwordToken;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/reset-password', {
            pageTitle: 'New password',
            path: '/reset/pswdtoken',
            userId: userId,
            passwordToken: pswdtoken,
            errorMessage: errors.array()[0].msg,
        });
    }
    let resetUser;
    User.findOne({
            resetToken: pswdtoken, //ky tu ?
            resetTokenExpiredTime: { $gt: Date.now() }, //thoi gian cho ?
            _id: userId // user do co phai khong ?
        })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiredTime = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => console.log(err));

};

exports.getUserSetting = (req, res, next) => {
    res.render('auth/user-setting', {
        pageTitle: 'Settings',
        path: '/setting',
        isAuthenticated: req.session.isLoggedIn,
        user: req.user,
        errorMessage: ''
    });
};

exports.postUserSetting = (req, res, next) => {
    const image = req.file;
    console.log(image);
    if (!image) {
        return res.status(422).render('auth/user-setting', {
            pageTitle: 'Settings',
            path: '/setting',
            isAuthenticated: req.session.isLoggedIn,
            user: req.user,
            errorMessage: 'Attached file is not an image',
        });
    }
    const imageUrl = image.path;
    req.user.userImage = imageUrl;
    req.user.save()
        .then(result => {
            console.log('Update user setting');
            res.redirect('/setting');
        })
        .catch(err => console.log(err));
}
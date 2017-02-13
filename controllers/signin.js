//setup
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var express = require('express');
var passport = require('passport');
var router = express.Router();
var config = require('../config.js');
router.use(passport.initialize());
router.use(passport.session());


//google strategy
passport.use(new GoogleStrategy({
        clientID: process.env.googleClientID,
        clientSecret: process.env.googleClientSecret,
        callbackURL: "http://127.0.0.1:3000/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {

        return done(null, profile);

    }
));

passport.serializeUser(function(user, callback) {
    callback(null, user);
});

passport.deserializeUser(function(user, callback) {
    callback(null, user);
});

router.get('/google',
    passport.authenticate('google', {
        scope: ['profile']
    }));

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });

module.exports = router;

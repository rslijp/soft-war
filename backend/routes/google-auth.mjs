import express from 'express';
import passport from "passport";
import app from "../app.mjs";
import GoogleOAuth from "passport-google-oauth";
const router = express.Router();

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

const GoogleStrategy = GoogleOAuth.OAuth2Strategy;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOLGE_REDIRECT_URL = process.env.GOOLGE_REDIRECT_URL;

passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOLGE_REDIRECT_URL
    },
    function(accessToken, refreshToken, profile, done) {
        console.log("Profile", profile);
        return done(null, profile);
    }
));

router.get('/google',
    passport.authenticate('google', { scope : ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/error' }),
    function(req, res) {
      // Successful authentication, redirect success.
      console.log("Callback",req.session);
      res.redirect('/auth/success');
    });


router.get('/success', (req, res) => {
  console.log(req.session.passport);
  res.redirect("/index.html")
});
router.get('/error', (req, res) => res.send("error logging in"));



export default router;
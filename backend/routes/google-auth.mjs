import connection from '../connections.mjs';
import express from 'express';
import passport from "passport";
import GoogleOAuth from "passport-google-oauth";
const router = express.Router();

async function users(){
    return connection.collection("users");
}

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


async function saveProfile(user){
    let collection = await users();
    return collection.replaceOne({email: user.email}, user, {upsert: true, hint: "user_email"});
}

router.get('/google',
    passport.authenticate('google', { scope : ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/error' }),
    function(req, res) {
      // Successful authentication, redirect success.
      res.redirect('/auth/success');
    });


router.get('/success', (req, res) => {
    // console.log("Success",req.session.passport);
    saveProfile(req.session.passport.user._json).then(()=>res.redirect("/"))
});
router.get('/error', (req, res) => res.send("error logging in"));

router.put('/logout', (req, res)=>{
    // console.log("Logout, redirecting to auth");
    req.session.destroy();
    return res.send({redirect: "/public/auth/"});
})

export default router;
import "./loadEnvironment.mjs";
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import session  from 'express-session';
import apeStateRouter from './routes/app-state.mjs';
import mapGeneratorRouter from './routes/map-generator.mjs';
import googleAuthRouter from './routes/google-auth.mjs';
import passport from 'passport';
import {sendTestMail} from "./mailer.mjs";

var app = express();

app.set('view engine', 'ejs');

app.use(logger('dev'));
// app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());


if(process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https')
            res.redirect(`https://${req.header('host')}${req.url}`)
        else
            next()
    })
}

app.use(function(req, res, next) {
    if(req.path==="/" || req.path==="/index.html" || req.path.startsWith("/api")) {
        if (!(req.session || {}).passport) {
            console.log("Redirecting to auth");
            if(req.path.startsWith("/api")) res.send({redirect: "/public/auth/"});
            else res.redirect("/public/auth/");
            return;
        }
        console.log("AUTH PASS",req.path);
    }
    next();
});

app.use(express.static(path.join(".", 'public')));
app.use('/api/app-state', apeStateRouter);
app.use('/api/map-generator', mapGeneratorRouter);
app.use('/auth', googleAuthRouter);

if(process.env.NODE_ENV === 'production') {
    sendTestMail();
}

export default app;

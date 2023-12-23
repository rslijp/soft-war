import "./loadEnvironment.mjs";
import cors from 'cors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import indexRouter from './routes/index.mjs';
import apeStateRouter from './routes/app-state.mjs';

// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');
// var indexRouter = require('./routes/index');
// var apeStateRouter = require('./routes/app-state');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if(process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https')
            res.redirect(`https://${req.header('host')}${req.url}`)
        else
            next()
    })
}

app.use(express.static(path.join(".", 'public')));
app.use('/', indexRouter);
app.use('/api/app-state', apeStateRouter);


export default app;

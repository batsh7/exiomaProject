const createError = require('http-errors');
const express = require('express'); 
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const {Log} = require('./collections/log')
const requestIp = require('request-ip')

/**
 * TODO: 
 * Change this to the real connection string!
 */
// db = mongoose.createConnection("mongodb://mongo-t:fasdewr@157.245.75.184/persons?authSource=admin")
  // db = mongoose.createConnection("mongodb://mongo-s:mongo1234@157.245.75.184/persons?authSource=admin")
db = mongoose.createConnection("mongodb://localhost/persons");

 
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users'); 

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


app.use('/', function (req, res, next) {
  try {
    let ip = requestIp.getClientIp(req)
    let typeRequest = req.method
    let date = new Date()
    let newLog = await new Log({ ip: ip, requestType : typeRequest, date:date })
    newLog = await newLog.save()
    let now = new Date();
    let sumMinuteAgo = new Date(now.getTime() - (1 * 60000));
    let logs = await Log.find({ ip: ip, date: { $gte: sumMinuteAgo } })
    let numLogs = logs.length;
    if (numLogs == 10) {
      let maxDate = await Log.findOne({}).sort({ date: -1 })
      let difference = now.getTime() - maxDate.date.getTime();
      let seconds = difference / 1000;
      let seconds_Between_Dates = Math.abs(seconds);
      let sec2 = 60 - seconds_Between_Dates;
      return res.json({ code: 200, data: "You have exceeded the allowed number of requests, you will have to wait " + sec2 + " seconds" })
    }
    else {
      next()
    }
  } catch (error) {
    res.send(error)
  }
})


module.exports = app;

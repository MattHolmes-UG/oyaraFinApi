const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const debug = require('debug')('app');

const app = express();
const db = process.env.MONGODB_URL;
const port = process.env.PORT || 3000;
const secretkey = process.env.SECRETKEY;

// models
const Customer = require('./models/customer');
// const Balance = require('./models/customerBalance');
const Transaction = require('./models/transactionDetails');

// Routers
const transactionRouter = require('./routes/transactionRoutes.js')(Customer, Transaction);
const customerRouter = require('./routes/customerRoutes.js')();

try {
  mongoose.connect(db, {
    useNewUrlParser: true
  });
} catch (error) {
  debug(error);
}

require('./config/passport');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS, PATCH');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, X-XSRF-TOKEN, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// All OPTIONS for preflight requests return a simple status: 'OK'
app.options('*', (req, res) => {
  res.json({
    status: 'OK'
  });
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: secretkey,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { maxAge: 3 * 24 * 60 * 60 * 1000 } // 3 days
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Endpoints
// Credit
// Debit
// Creation of Account
// Change status
app.use('/api/transactions', transactionRouter);
app.use('/api/customer', customerRouter);

app.get('/', (req, res) => {
  debug('requesting home...');
  res.send('Welcome MH-Financial-api');
});

app.listen(port, () => {
  debug(`Server running on port ${port}`);
});

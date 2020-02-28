const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const debug = require('debug')('app:passport');

const Customer = require('../models/customer');
const Balance = require('../models/customerBalance');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Customer.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use('local.accountCreation', new LocalStrategy({
  usernameField: 'accountNumber',
  passwordField: 'bvn',
  passReqToCallback: true,
}, (req, accountNumber, bvn, done) => {
  debug(req.body);
  debug('acctno', accountNumber, 'bvn', bvn);
  // check if customer exists with the account number
  Customer.findOne({ accountNumber }, (err, customer) => {
    if (err) {
      return done(err);
    }
    if (customer) {
      return done(null, false, { message: 'Account already exists' });
    }
    // add more validation for other properties
    let newCustomer;
    try {
      newCustomer = new Customer(req.body);
    } catch (mongoErr) {
      debug(mongoErr);
      return done(mongoErr);
    }
    const customerBalance = new Balance({
      accountNumber: newCustomer.accountNumber,
      currency: newCustomer.currency,
      customer: newCustomer._id
    });
    customerBalance.save((error, balance) => {
      if (error) {
        debug(error);
        return done(error);
      }
      newCustomer.accountBalance = balance._id;
      newCustomer.save((errOnSave) => {
        if (errOnSave) {
          debug(errOnSave);
          return done(errOnSave);
        }
        return done(null, newCustomer);
      });
    });
  });
}));

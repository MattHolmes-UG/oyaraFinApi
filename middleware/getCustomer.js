const debug = require('debug')('app:getCustomer');
const Customer = require('../models/customer');

module.exports = (req, res, next) => {
  if (req.body.accountNumber || req.params.accountNumber) {
    // eslint-disable-next-line max-len
    const accountNumber = req.body.accountNumber ? req.body.accountNumber : req.params.accountNumber;
    Customer.findOne({ accountNumber }, (err, customer) => {
      if (err) {
        debug(err);
        return res.json({ message: 'An error occured while trying to get customer' });
      }
      if (!customer) {
        debug('Account does not exist');
        return res.json({ message: 'Account not found' });
      }
      req.customer = customer;
      next();
    });
  }
  next();
};

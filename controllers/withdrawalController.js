const crypto = require('crypto');
const debug = require('debug')('app:transactionRoutes');

const Balance = require('../models/customerBalance');
const Transaction = require('../models/transactionDetails');

module.exports = (req, res) => {
  const {
    accountNumber,
    amount, // This should include charges
    currency,
    channel,
    narration,
  } = req.body;
  const { customer } = req;
  let customerBalance;
  if (customer.currency === currency) {
    req.flash('error', `${currency} not allowed on this account`);
    return res.redirect('/api/transactions/');
  }
  if (!narration) {
    req.flash('error', 'Description of transaction is required');
    return res.redirect('/api/transactions/');
  }
  // eslint-disable-next-line no-restricted-globals
  if (amount === undefined || typeof amount !== 'number' || isNaN(Number(amount))) {
    req.flash('error', 'Invalid amount');
    return res.redirect('/api/transactions/');
  }
  Balance.findOne({ accountNumber }, (err, balance) => {
    if (err) {
      debug(err);
      return res.json({ error: 'Error occured before transaction was made' });
    }
    customerBalance = balance.availableBalance;
  });
  // check minimum balance to actual balance
  if (customerBalance <= customer.minimumBalance || Number(amount) > customerBalance) {
    return res.statusCode(402).json({
      error: 'Account balance too low to perform transaction'
    });
  }
  // Process transaction
  const balanceAfter = customerBalance - Number(amount);
  const referenceId = crypto.randomBytes(10).toString('hex');
  const newTransaction = new Transaction({
    accountNumber,
    amount,
    currency,
    debitOrCredit: 'debit',
    narration,
    referenceId,
    balanceAfter,
    transactionType: 'withdrawal',
    customer: customer._id
  });
  // update balance
  customerBalance.availableBalance = balanceAfter;
  // update customer details
  customer.lastTransactionDate = new Date();
  customer.transactions.push(newTransaction._id);
  // save customer, transaction and customerbalance
  if (channel) newTransaction.channel = channel;
  newTransaction.save((err) => {
    if (err) {
      debug(err);
      req.flash('error', 'An error occured during transaction, please try again');
      return res.redirect('/api/transactions/');
    }
    // save balance
    customerBalance.save((saveBalanceErr) => {
      if (saveBalanceErr) {
        debug(saveBalanceErr);
        req.flash('error', 'An error occured while updating balance, please try again');
      }
    });
    // save customer
    customer.save((saveCustomerErr) => {
      if (saveCustomerErr) {
        debug(saveCustomerErr);
        req.flash('error', 'An error occured while updating user, please try again');
      }
      // For further dev, send alert
      return res.json({
        message: 'Transaction successful',
        error: req.flash('error'),
        transaction: newTransaction
      });
    });
  });
};

const crypto = require('crypto');
const debug = require('debug')('app:transactionRoutes');

const Balance = require('../models/customerBalance');
const Transaction = require('../models/transactionDetails');
const Customer = require('../models/customer');

module.exports = (req, res) => {
  const {
    accountNumber,
    amount, // This should include charges
    currency,
    channel,
    narration,
    recipientAccountNumber
  } = req.body;
  const { customer } = req;
  let customerBalance;
  if (customer.currency !== currency) {
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

  // Process and check sender's balance

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
  // Start Sender processing
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
    transactionType: 'transfer',
    to: recipientAccountNumber,
    customer: customer._id
  });
  // update balance
  customerBalance.availableBalance = balanceAfter;
  // update customer details
  customer.lastTransactionDate = new Date();
  customer.transactions.push(newTransaction._id);
  // save customer, transaction and customerbalance
  if (channel) newTransaction.channel = channel;

  // Get recipient details
  Customer.findOne({ recipientAccountNumber }, (err, recipientAcct) => {
    if (err) {
      debug(err);
      return res.json({ message: 'An error occured while trying to get customer' });
    }
    if (!recipientAcct) {
      debug('Account does not exist');
      return res.json({ message: 'Account not found' });
    }
    // check currency match
    if (recipientAcct.currency !== currency) {
      req.flash('error', `${currency} not allowed on this account`);
      return res.redirect('/api/transactions/');
    }
    // Start recipient processing
    // Process transaction
    const recipient = recipientAcct;
    recipientAcct.populate('accountBalance');
    const recipientBalance = recipientAcct.accountBalance.availableBalance;
    const recipientBalanceAfter = recipientBalance + Number(amount);
    const recipientReferenceId = crypto.randomBytes(10).toString('hex');
    const recipientTransaction = new Transaction({
      accountNumber: recipientAccountNumber,
      amount,
      currency,
      debitOrCredit: 'credit',
      narration,
      referenceId: recipientReferenceId,
      balanceAfter: recipientBalanceAfter,
      transactionType: 'transfer',
      from: accountNumber,
      customer: customer._id
    });
    // update customer details
    recipient.transactions.push(recipientTransaction._id);
    recipient.lastTransactionDate = new Date();
    if (channel) recipientTransaction.channel = channel;
    // save customer, transaction and customerbalance
    recipientTransaction.save((rErr) => {
      if (rErr) {
        debug(rErr);
        req.flash('error', 'An error occured during transaction, please try again');
        return res.redirect('/api/transactions/');
      }
      // save balance
      recipientBalance.save((saveBalanceErr) => {
        if (saveBalanceErr) {
          debug(saveBalanceErr);
          // For further dev, save failure in session and try again later
          req.flash('error', 'An error occured while updating recipient balance, please try again');
        }
      });
      // save customer
      recipient.save((saveCustomerErr) => {
        if (saveCustomerErr) {
          debug(saveCustomerErr);
          req.flash('error', 'An error occured while updating user, please try again');
        }
      });
    });
  });

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
      return res.json({
        message: 'Transaction successful',
        error: req.flash('error'),
        transaction: newTransaction
      });
    });
  });
};

const express = require('express');
const debug = require('debug')('app:transactionRoutes');
const csrf = require('csurf');

const csrfProtection = csrf();

const getCustomer = require('../middleware/getCustomer');
const checkAccountStatus = require('../middleware/checkAccountStatus');
const transferController = require('../controllers/transferController');
const withdrawalController = require('../controllers/withdrawalController');
const creditAccountController = require('../controllers/creditAccountController');

const routes = (Customer, Transaction) => {
  const transactionRouter = express.Router();

  transactionRouter.use(csrfProtection);
  transactionRouter.use(getCustomer);
  transactionRouter.use('/', checkAccountStatus);

  transactionRouter.route('/transfer')
    .get((req, res) => {
      res.json({
        token: req.csrfToken(),
        error: req.flash('error')
      });
    })
    .post(transferController);
  transactionRouter.route('/withdrawal')
    .get((req, res) => {
      res.json({
        token: req.csrfToken(),
        error: req.flash('error')
      });
    })
    .post(withdrawalController);
  // To credit my account
  transactionRouter.route('/credit')
    .get((req, res) => {
      res.json({
        token: req.csrfToken(),
        error: req.flash('error')
      });
    })
    .post(creditAccountController);

  transactionRouter.route('/last/:accountNumber')
    .get((req, res) => {
      debug(`requesting last transaction of ${req.customer.accountNumber}`);
      const { transactions } = req.customer;
      const lastTransaction = transactions[transactions.length - 1];
      return res.json({ lastTransaction });
    });

  transactionRouter.route('/all/:accountNumber')
    .get((req, res) => {
      debug(`requesting transaction records of ${req.customer.accountNumber}`);
      const { transactions } = req.customer;
      return res.json({ transactions });
    });

  transactionRouter.route('/:referenceId')
    .get((req, res) => {
      const { referenceId } = req.params;
      debug(`requesting transaction with id ${referenceId}`);
      Transaction.findOne({ referenceId }, (error, transaction) => {
        if (error) {
          debug(error);
        }
        debug('Transaction found', referenceId);
        return res.json({ transaction });
      });
    });

  return transactionRouter;
};

module.exports = routes;

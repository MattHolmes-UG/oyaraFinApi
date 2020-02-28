const express = require('express');
const debug = require('debug')('app:customerRoutes');
const passport = require('passport');
const csrf = require('csurf');

const csrfProtection = csrf();
const getCustomer = require('../middleware/getCustomer');

const routes = () => {
  const customerRouter = express.Router();

  customerRouter.use(csrfProtection);

  customerRouter.route('/create')
    .get((req, res) => {
      res.json({
        token: req.csrfToken(),
        message: req.flash('error')
      });
    })
    .post(passport.authenticate('local.accountCreation', {
      failureFlash: true,
      failureRedirect: '/api/customer/create'
    }), (req, res) => {
      res.json({
        customerDetails: req.user
      });
    });

  customerRouter.use(getCustomer);
  customerRouter.route('/change-status')
    .get((req, res) => {
      res.json({
        token: req.csrfToken(),
        message: req.flash('error')
      });
    })
    .post((req, res) => {
      const { status } = req.body;
      const { customer } = req;
      // if status is the same return status is same
      const formerStatus = customer.status;
      if (formerStatus === status) {
        return res.json({
          message: `Account status already ${status}`
        });
      }
      const editToCustomer = customer;
      editToCustomer.status = status;
      editToCustomer.timeOfStatusChange = new Date();
      editToCustomer.save((err) => {
        if (err) {
          req.flash('error', 'An error occured while trying to save changes, please try again');
          return res.redirect('/api/customer/change-status');
        }
        return res.json({
          message: `Status of account changed from ${formerStatus} to ${status}`
        });
      });
    });

  customerRouter.route('/balance/:accountNumber')
    .get((req, res) => {
      const { balance } = req.customer.accountBalance;
      balance.lastRequested = new Date();
      balance.save((err) => debug(err));
      return res.json({ balance });
    });

  customerRouter.route('/bvn/:accountNumber')
    .get((req, res) => res.json({ bvn: req.customer.bvn }));

  customerRouter.route('/check-status/:accountNumber')
    .get((req, res) => res.json({ bvn: req.customer.status }));

  return customerRouter;
};

module.exports = routes;

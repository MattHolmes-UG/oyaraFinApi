const debug = require('debug')('app:getCustomer');

module.exports = (req, res, next) => {
  if (req.customer.status === 'frozen') {
    debug(`${req.customer.accountNumber} transaction forbidden`);
    return res.statusCode(402).json({
      message: 'Transaction forbidden. Account has been frozen'
    });
  }
  next();
};

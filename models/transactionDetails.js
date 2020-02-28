const mongoose = require('mongoose');

const { Schema } = mongoose;

const transactionSchema = new Schema({
  accountNumber: {
    type: Number,
    required: true,
    min: 10,
    validate: {
      validator(v) {
        return v.toString().match(/\d/g).length === 10;
      },
      message: (props) => `${props.value} is not a valid email!`
    }
  },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, minlength: 3, maxlength: 3 },
  channel: { type: String, minlength: 3 },
  debitOrCredit: { type: String, required: true, minlength: 2, enum: ['Dr', 'Cr', 'Debit', 'Credit'] },
  narration: { type: String, required: true },
  referenceId: { type: String, required: true },
  transactionDate: { type: Date, required: true, default: new Date() },
  valueDate: { type: Date, required: true, default: new Date() },
  transactionType: { type: String, required: true, enum: ['transfer', 'withdrawal', 'credit'] }, // Transfer, withdrawal
  balanceAfter: { type: Number, required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
  from: Number,
  to: Number
});

module.exports = mongoose.model('Transaction', transactionSchema);

const mongoose = require('mongoose');

const { Schema } = mongoose;

const customerSchema = new Schema({
  accountNumber: {
    type: Number,
    required: true,
    min: 10,
    validate: {
      validator(v) {
        return v.toString().match(/\d/g).length === 10;
      },
      message: (props) => `${props.value} is not a valid email!`
    } },
  accountName: { type: String, required: true, minlength: 4 },
  accountOpeningDate: { type: Date, default: new Date(), immutable: true, required: true },
  currency: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 3,
    immutable: true,
  },
  // default to now on opening
  lastTransactionDate: { type: Date, default: new Date(), immutable: true, required: true },
  accountType: { type: String, required: true, enum: ['current', 'savings'] },
  bvn: { type: Number, required: true },
  fullname: { type: String, required: true },
  phoneNumber: { type: Number },
  email: {
    type: String,
    validate: {
      validator(v) {
        return /[a-zA-Z]{1}\w{3,}@[a-z]{2,}.[a-zA-Z]{2,}/.test(v);
      },
      message: (props) => `${props.value} is not a valid email!`
    }
  },
  status: { type: String, required: true, default: 'active', enum: ['dormant', 'active', 'inactive', 'frozen'] },
  transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  accountBalance: { type: Schema.Types.ObjectId, ref: 'CustomerBalance' },
  created: { type: Date, default: new Date(), immutable: true }, // immutable for now
  timeOfStatusChange: { type: Date }
});

module.exports = mongoose.model('Customer', customerSchema);

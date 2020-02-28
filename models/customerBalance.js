const mongoose = require('mongoose');

const { Schema } = mongoose;

const balanceSchema = new Schema({
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
  currency: { type: String, required: true, minlength: 3, maxlength: 3 },
  availableBalance: { type: Number, required: true, default: 0 },
  minimumBalance: { type: Number, default: 0 },
  holdBalance: { type: Number, default: 0 },
  lastRequested: { type: Date, required: true, default: new Date() },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer' }
});

module.exports = mongoose.model('CustomerBalance', balanceSchema);

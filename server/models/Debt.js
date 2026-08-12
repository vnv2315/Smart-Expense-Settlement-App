import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Debt amount must be an integer number of paise',
      },
    },
    status: {
      type: String,
      enum: ['PENDING', 'SETTLED'],
      default: 'PENDING',
    },
    settledAt: Date,
    settledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

const Debt = mongoose.model('Debt', debtSchema);

export default Debt;

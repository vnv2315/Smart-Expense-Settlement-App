import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUser: {
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
        message: 'Settlement amount must be an integer number of paise',
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

settlementSchema.index({ group: 1, status: 1 });
settlementSchema.index(
  { group: 1, fromUser: 1, toUser: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'PENDING' },
  },
);

const Settlement = mongoose.model('Settlement', settlementSchema);

export default Settlement;

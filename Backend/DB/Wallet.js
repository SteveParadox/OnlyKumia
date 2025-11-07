import mongoose from 'mongoose';

const { Schema } = mongoose;

const txSchema = new Schema({
  type: { type: String, enum: ['credit','debit','fee','tip'], required: true },
  amount: { type: Number, required: true },
  from: { type: Schema.Types.ObjectId, ref: 'User' },
  to: { type: Schema.Types.ObjectId, ref: 'User' },
  meta: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const walletSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'TOK' },
  transactions: [txSchema]
}, { timestamps: true });

export default mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);

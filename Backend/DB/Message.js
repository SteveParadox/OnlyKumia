import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: Schema.Types.ObjectId, ref: 'User' },
  toStream: { type: Schema.Types.ObjectId, ref: 'Stream' },
  content: { type: String, required: true },
  status: { type: String, enum: ['delivered','flagged','blocked'], default: 'delivered' },
  flaggedReason: { type: String },
  meta: Schema.Types.Mixed,
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);

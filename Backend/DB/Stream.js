import mongoose from 'mongoose';

const { Schema } = mongoose;

const streamSchema = new Schema({
  title: { type: String },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  streamKey: { type: String, required: true, unique: true },
  ingestUrl: { type: String },
  playbackUrl: { type: String },
  status: { type: String, enum: ['created','live','ended','killed'], default: 'created' },
  startedAt: { type: Date },
  endedAt: { type: Date },
  viewers: { type: Number, default: 0 },
  isFlagged: { type: Boolean, default: false },
  moderation: [{
    reason: String,
    level: { type: String, enum: ['info','flag','critical'], default: 'info' },
    meta: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

export default mongoose.models.Stream || mongoose.model('Stream', streamSchema);

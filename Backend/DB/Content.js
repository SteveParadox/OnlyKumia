import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: String,
  s3Key: String,
  size: Number,
  contentType: String,
  fileHash: String,
  status: { type: String, enum: ['quarantine','processing','published','flagged','rejected'], default: 'quarantine' },
  moderation: {
    autoResult: { type: String },
    reviewNotes: String,
    reviewedBy: String,
    reviewedAt: Date
  },
  metadata: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

contentSchema.pre('save', function(next){
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Content', contentSchema);

import mongoose from 'mongoose';
const { Schema } = mongoose;
const auditLogSchema = new Schema({
  action: { type: String, required: true },
  actor: { type: Schema.Types.ObjectId, ref: 'User' },
  target: { type: String },
  details: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, immutable: true }
}, { timestamps: false });
auditLogSchema.pre('save', function(next) { this.createdAt = new Date(); next(); });
export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
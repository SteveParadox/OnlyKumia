import mongoose from 'mongoose';

const kycSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'flagged'],
    default: 'pending'
  },
  documentType: {
    type: String,
    enum: ['passport', 'national_id', 'drivers_license'],
    required: true
  },
  documentHash: {
    type: String,
    required: true
  },
  selfieHash: {
    type: String,
    required: true
  },
  metadata: {
    fullName: String,
    dateOfBirth: Date,
    country: String,
    documentNumber: String,
    documentExpiry: Date
  },
  verificationToken: {
    type: String,
    required: false
  },
  verificationProvider: {
    type: String,
    required: false
  },
  reviewNotes: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
kycSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('KYC', kycSchema);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  avatar: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true
  },
  isMaster: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  theme: {
    type: String,
    enum: ['dark', 'light'],
    default: 'dark'
  },
  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'trialing', 'active', 'canceled', 'past_due', 'incomplete'],
    default: 'trialing',
  },
  trialEndsAt: {
    type: Date,
    default: null,
  },
  billingInterval: {
    type: String,
    enum: ['month', 'year', null],
    default: null,
  },
  stripeCustomerId: {
    type: String,
    default: null,
  },
  stripeSubscriptionId: {
    type: String,
    default: null,
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  subscriptionExpiresAt: {
    type: Date,
    default: null,
  },
  preferences: {
    currency: {
      type: String,
      default: 'EUR',
    },
    notifications: {
      emailBriefing: { type: Boolean, default: true },
      macroAlerts: { type: Boolean, default: true },
      communityMentions: { type: Boolean, default: true },
    },
  },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

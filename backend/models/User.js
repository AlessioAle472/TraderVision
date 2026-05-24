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
  theme: {
    type: String,
    enum: ['dark', 'light'],
    default: 'dark'
  },
  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  }
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

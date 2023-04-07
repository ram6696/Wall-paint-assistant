const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true,
});

UserSchema.index({email: 1}, {unique: true})

module.exports = mongoose.model("users", UserSchema);

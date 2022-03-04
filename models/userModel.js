const mongooose = require('mongoose');
const userSchema = new mongooose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    qualification: {
      type: String,
    },
    img: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    speciality: {
      type: String,
    },
    contact_number: { type: String, unique: true },
    dob: {
      type: String,
    },
    device_id: [],
    isNumberVerified: { type: Boolean },
    forgotPasswordOTP: { type: String },
    phoneNumberOTP: { type: String },
    role: {
      type: Number,
      required: true,
      //1 for admin and 2 for normal user and 3 for unverified user
    },
  },
  {
    timestamps: true,
  }
);

const userModel = mongooose.model('users', userSchema);

module.exports = {userModel};

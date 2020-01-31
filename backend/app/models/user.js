const mongoose = require('mongoose'),
  bcrypt = require('bcrypt'),
  SALT_WORK_FACTOR = 10;

const schemaOptions = {
  timestamps: {createdAt: 'created_at', updatedAt: 'last_updated'},
};

const userSchema = mongoose.Schema({
  // _id: mongoose.Schema.Types.ObjectId,
  user_id: String,

  userName: {
    type: String,
    unique: true
  },
  phoneNumber: {
    type: Number,
    unique: true
  },
  password: String,
  firstName: String,
  lastName: String
}, schemaOptions);

userSchema.pre('save', function (next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) cb(err, null);
    cb(null, isMatch);
  });
};

var User = mongoose.model('User', userSchema);
module.exports = User;

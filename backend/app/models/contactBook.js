const mongoose = require('mongoose');

const schemaOptions = {
  timestamps: {createdAt: 'created_at', updatedAt: 'last_updated'},
};

const contactBookSchema = mongoose.Schema({
  contact_id: String,
  userId: String,
  numbers: {
    type: Array,
    unique: true
  },
}, schemaOptions);

var ContactBook = mongoose.model('ContactBook', contactBookSchema);
module.exports = ContactBook;

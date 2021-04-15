const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    expiry_date: { type: String, default: "" },
    id_number: { type: String, default: "" },
    // when audit trial ran for the uploaded document it will be set to true
    done: { type: Boolean, default: false },
    doc_type: {
        type: String,
        default: ''
    },
    date: String,
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
const mongoose = require('mongoose');

const Tesseract = new mongoose.Schema({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    result: {
        type: String,
        required: true
    },
}, { timestamps: true });

module.exports = mongoose.model('Tesseract', Tesseract);
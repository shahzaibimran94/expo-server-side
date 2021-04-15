const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    national_insurance_no: {
        type: String,
        required: true
    },
    unique_tax_reference: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
        required: true
    },
    title: {
        type: String,
        trim: true,
    }, 
    first_name: {
        type: String,
        trim: true,
    }, 
    last_name: {
        type: String,
        trim: true,
    }, 
    dob: {
        type: String,
        trim: true,
    }, 
    address: {
        type: String,
        trim: true,
    }, 
    tokens: {
        type: Array,
        default: []
    }, 
    gender: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true, 
        lowercase: true, 
        match: [/\S+@\S+\.\S+/, 'is invalid'], 
        index:  {
            unique: true, 
            dropDups: true
        }
    }, 
    address_line_2: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        trim: true,
    }, 
    state: {
        type: String,
        trim: true,
    }, 
    post_code: {
        type: String,
        trim: true,
    }, 
    country: {
        type: String,
        trim: true,
    }, 
    phone_number: {
        type: String,
        trim: true,
    }, 
    home_number: {
        type: String,
        trim: true,
    }, 
    private_insurance_provider: {
        type: String,
        trim: true,
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
const UserDB = require('../models/user');
const DocumentDB = require('../models/document');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { secret, verify_user } = require('../utils/index');

const register = async function (req, res, next) {
    try {
        const { national_insurance_no, password } = req.body;
        
        // Is NI or password provided?
        if (!national_insurance_no || !password)
            throw new Error('National Insurance Number and Password both are required');
        
        if (password && password.length < 6)
            throw new Error('Password cannot be less than 6 characters');
        
        // Is NI valid? 
        const isValid = national_insurance_no.match(/^[A-CEGHJ-PR-TW-Z]{1}[A-CEGHJ-NPR-TW-Z]{1}[0-9]{6}[A-D]{1}$/i);
        if (!isValid)
            throw new Error('Invalid National Number was provided');

        // Create User Instance withr required fields and then save it
        const userExists = await UserDB.findOne({ national_insurance_no });
        if (userExists)
            throw new Error("User already exists");
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        const user = new UserDB({
            national_insurance_no,
            password: hash
        });
        const dbuser = await user.save();
        const { 
            _id, title, first_name, last_name, dob, 
            address, gender, email, address_line_2,
            city, state, post_code, country, 
            phone_number, home_number, private_insurance_provider 
        } = dbuser;
        const token = jwt.sign({ _id }, secret, { expiresIn: '8h' });
        dbuser.tokens = [token];
        await dbuser.save();
        return res.json({
            message: 'User has been registered',
            token,
            user: {
                _id,
                national_insurance_no,
                unique_tax_reference,
                title, first_name, last_name, dob, 
                address, gender, email, address_line_2,
                city, state, post_code, country, unique_tax_reference,
                phone_number, home_number, private_insurance_provider
            }
        });
    } catch (err) { next(err) };
};

const login = async function (req, res, next) {
    try {
        const { national_insurance_no, password } = req.body;
        if (!national_insurance_no || !password)
            throw new Error('Invalid (National Insurance Number / Password) ');
        const user = await UserDB.findOne({ national_insurance_no });
        if (!user)
            throw new Error('Invalid (National Insurance Number / Password) ');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            throw new Error('Invalid (National Insurance Number / Password) ');
        const { 
            _id, title, first_name, last_name, dob, 
            address, gender, email, address_line_2,
            city, state, post_code, country, unique_tax_reference, 
            phone_number, home_number, private_insurance_provider 
        } = user;
        const token = jwt.sign({ _id }, secret, { expiresIn: '8h' });
        // For multiple devices
        // user.tokens = user.tokens.concat(token);
        // For Single Device
        user.tokens = [token];
        const response = await verify_user(_id);
        if (typeof response === 'string')
            throw new Error(response);
        user.verified = response;
        await user.save();
        const documents = await DocumentDB.find({ user: _id }).select('type url');
        return res.json({
            message: 'Logged in',
            token,
            user: {
                _id,
                national_insurance_no,
                unique_tax_reference,
                documents,
                title, first_name, last_name, dob, 
                address, gender, email, address_line_2,
                city, state, post_code, country, 
                phone_number, home_number, private_insurance_provider
            },
            verified: response
        });
    } catch (err) { next(err) };
};

module.exports = {
    register,
    login
};
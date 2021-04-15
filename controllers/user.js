const path = require('path');
const mime = require('mime');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const UserDB = require('../models/user');
const DocumentDB = require('../models/document');
const TesseractDB = require('../models/tesseract');
const mongoose = require('mongoose');
const publicIp = require('public-ip');
const { verify_user, fetch_dvla_information, secret } = require('../utils/index');
const Tesseract = require('tesseract.js');
const worker = Tesseract.createWorker({
    logger: m => console.log(m)
});

const upload_file = async function (req, res, next) {
    try {
        const { type, doc_type } = req.params;
        const _id = req.user;
        const file = req.file;
        
        // User _id will be validated as it will be used to reference a document
        if (!_id || (_id && !mongoose.Types.ObjectId.isValid(_id)))
            throw new Error('UnAuthorized Access');
        
        // A file existance check
        if (!file)
            throw new Error('File is required');
        
        // Save file data in DB against user with a document type
        const { filename } = file;
        const ip = await publicIp.v4();
        const document = await DocumentDB.findOne({ user: _id, type });
        if (document) {
            document.url = filename;
            document.ip = ip;
            document.date = new Date();
            document.user = _id;
            await document.save();
        } else {
            await new DocumentDB({
                url: filename,
                type,
                doc_type,
                user: _id,
                ip,
                date: new Date()
            }).save();
        }
        
        return res.json({
            message: 'File Uploaded'
        });
    } catch (err) { next(err) };
};

const verify = async function (req, res, next) {
    try {
        const _id = req.user;
        let verified = true;
        
        // Save verify as a boolean in DB
        const user = await UserDB.findOne({ _id });
        if (!user)
            throw new Error('UnAuthorized Access');
        const response = await verify_user(user._id);
        if (typeof response === 'string')
            throw new Error(response)
        verified = response;
        user.verified = verified;
        await user.save();

        if (!verified) {
            throw new Error('Verification Failed');
        } else {
            return res.json({
                message: 'User has been verified',
                verified
            });
        }
    } catch (err) { next(err) };
};

const delete_document = async function (req, res, next) {
    try {
        const _id = req.user;
        const { type } = req.params;
        await DocumentDB.findOneAndDelete({ user: _id, type });
        return res.json({
            message: 'Document has been removed'
        });
    } catch (error) { next(error); }
};

const update_user = async function (req, res, next) {
    try {
        const _id = req.user;
        const allowed_fields = [
            'title', 'first_name', 'last_name', 'dob', 
            'gender', 'email', 'unique_tax_reference',
            'password', 'address', 'address_line_2',
            'city', 'state', 'post_code', 'country', 
            'phone_number', 'home_number', 
            'private_insurance_provider'
        ];
        const keys = Object.keys(req.body);
        for (let key of keys) {
            if (allowed_fields.indexOf(key) < 0)
                throw new Error('Invalid data has been provided');
        }
        let data = req.body
        const { password } = data; 
        if (password) {
            if (password.length < 6)
                throw new Error('Password cannot be less than 6 characters');
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            data.password = hash;
        }
        await UserDB.findOneAndUpdate({ _id }, data);
        return res.json({
            message: 'User has been updated'
        });
    } catch (error) { next(error); }
}

const audit_trial = async function (req, res, next) {
    try {
        const _id = req.user;
        const { type } = req.body;
        
        const document = await DocumentDB.findOne({ user: _id, type });
        if (!document)
            throw new Error('We have no document to run an audit trial against the given document type');

        if (document.done) {
            return res.json({
                message: `Audit Trial For ${type} already done`,
                filtered_data: null
            });
        } else {
            const { url } = document;
            const file_path = path.join(__dirname, '../','/file_storage/', type, url);
            try {
                await worker.load();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                const { data: { text } } = await worker.recognize(file_path);
                
                // All processed document results will be saved to be able to right more effective algo to fetch
                // as much meaningfull data from the result given by the library.
                await new TesseractDB({
                    document: document._id,
                    result: text
                });

                let filtered_data;
                const { doc_type } = document;
                if (doc_type === 'Driving License') {
                    filtered_data = fetch_dvla_information(text.split('\n'));
                    document.expiry_date = filtered_data.expiry_date ? filtered_data.expiry_date : null;
                    document['done'] = true;
                    await document.save();
                    await UserDB.findOneAndUpdate({ _id }, filtered_data);
                }
                // await worker.terminate();
                return res.json({
                    message: `Audit Trial For ${type}`,
                    filtered_data
                }); 
            } catch (exception) {
                console.log(exception);
                throw new Error('OCR Not able to fetch data from the document');
            }
        }
    } catch (err) { next(err) };
};

const access_document = async function (req, res, next) {
    try {
        const _id = req.user;
        const { type } = req.params;

        const { url } = await DocumentDB.findOne({ user: _id, type });
        const file_path = path.join(__dirname, '../','/file_storage/', type, url);
        const mimetype = mime.lookup(file_path);

        return res.json({
            url,
            mime: mimetype
        });
    } catch (err) { next(err) };
};

const document_stream = async function (req, res, next) {
    try {
        const { type, url } = req.params;

        const file_path = path.join(__dirname, '../','/file_storage/', type, url);

        const filename = path.basename(file_path);
        const mimetype = mime.lookup(file_path);

        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', mimetype);

        const filestream = fs.createReadStream(file_path);
        filestream.pipe(res);
    } catch (err) { next(err) };
}

module.exports = {
    upload_file,
    verify,
    delete_document,
    audit_trial,
    update_user,
    access_document,
    document_stream
};
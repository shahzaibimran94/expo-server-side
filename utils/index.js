const DocumentDB = require('../models/document');
const secret = 'dr-plus-admin';

const db_connect = (mongoose) => {
    const DB_OPTIONS = {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    };
    const DB_SERVER = '127.0.0.1:27017';
    const DB_NAME = 'drplus';
    const DB_URL = `mongodb://${DB_SERVER}/${DB_NAME}`;

    mongoose.connect(DB_URL, DB_OPTIONS)
    .then(() => console.log('DB Connected'))
    .catch(() => console.log('DB Connection Error'));
};

const verify_user = async (_id) => {
  let verified = true;
  try {
    const documents = await DocumentDB.find({ user: _id });
    if (documents && Array.isArray(documents) && documents.length < 4)
        verified = false;
  } catch (error) {
      return error.message;
  }
  return verified;  
}

const fetch_dvla_information = (array_of_information) => {
    // "4a. ": "issue_date",
    // "40. ": "issue_date", 
    const keys_to_find_data = {
        "1. ": "last_name",
        "2. ": "first_name", 
        "3. ": "dob", 
        "4b. ": "expiry_date", 
        "5. ": "id_number", 
        "8. ": "address", 
        "a. ": "address"
    };
    const filtered_data = {
        title: "", 
        first_name: "", 
        last_name: "", 
        dob: "", 
        expiry_date: "",
        id_number: "", 
        address: "" 
    };
    for (const key of Object.keys(keys_to_find_data)) {
        for (const entity of array_of_information) {
            if (entity.includes(key)) {
                try {
                    let new_data = entity.split(key)[1].trim();
                    const actual_key = keys_to_find_data[key];
                    if (actual_key === 'first_name') {
                        // Some time we have Mr or Ms Before Name in Full Driving License
                        const first_name_parts = new_data.split(' ');
                        if (first_name_parts.length > 1) {
                            const [title, first_name] = first_name_parts;
                            new_data = first_name;
                            filtered_data['title'] = title;
                        } else {
                            const [first_name] = first_name_parts;
                            new_data = first_name;
                        }
                    }
                    if (actual_key === 'dob' || actual_key === 'expiry_date')
                        new_data = new_data.split(' ')[0];
                    if (actual_key === 'id_number') {
                        const [section1, section2] = new_data.split(' ');
                        new_data = section1 + ' ' +section2;
                    }
                    filtered_data[actual_key] = new_data;
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }
    return filtered_data;
}

module.exports = {
    db_connect,
    verify_user,
    fetch_dvla_information,
    secret
};
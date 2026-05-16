const mongoose = require('mongoose');
const {DB_URL} = process.env;


const dbConnection = () => {
    mongoose.connect(DB_URL, { dbName: process.env.DB_NAME || 'AWSPayroll' })
        .then(() => console.log(`Database Connection Successfull: ${mongoose.connection.name}`))
        .catch(err => console.log('Failed To Connect With Database, \nReason : ' + err.message))
}

module.exports = dbConnection;

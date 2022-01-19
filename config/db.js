const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    } catch (err){
        console.log("Error " + err.message);
        process.exit(1);
    }
}

module.exports = connectDB;
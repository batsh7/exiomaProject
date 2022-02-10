const {Schema} = require('mongoose');

const LogSchema = {
    ip: {type: String},
    requestType: {type: String},
    date: {type: date}
}

const LogModel = db.model('log', LogSchema);

module.exports.Log = LogModel;

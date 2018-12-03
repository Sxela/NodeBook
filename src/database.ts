let mongoose = require('mongoose');
import config = require('./config/config');
    
class Database {
  constructor() {
    this._connect()
  }
_connect() {
     mongoose.connect(`mongodb://${config.mongoUrl}/${config.mongoDatabase}`, `${config.mongoOptions}`)
       .then(() => {
         console.log('Database connection successful')
       })
       .catch(err => {
         console.error('Database connection error')
       })
  }
}
module.exports = new Database()
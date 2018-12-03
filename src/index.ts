
import config = require('./config/config');
import * as router from './routes/addresses'
import * as express from 'express'


let db = require('./database');
const App = express();

App.listen(config.port, (err: Error) => {
    if (err) {
        console.log('Error: ', err)
    }
    return console.log(`Server is listening on ${config.port}`)
})

App.use(router)

import config = require('./config/config');
import * as router from './routes/addresses';
import * as express from 'express';
import * as cors from 'cors';
import db = require('./database');

db;

var prod = false; //use false for staging

const App = express();

App.use(cors())
App.use(router)
App.use(express.static('static'));

if (prod) {
  require('greenlock-express').create({

    version: 'draft-11'
  , server: 'https://acme-v02.api.letsencrypt.org/directory'  
  , email: 'your@email.com'                                   // CHANGE THIS
  , agreeTos: true
  , approveDomains: (opts, certs, cb) => {
      if (certs) {
        // change domain list here
        opts.domains = ['your.domain.com'] // CHANGE THIS
      } else { 
        // change default email to accept agreement
        opts.email = 'your@email.com';  // CHANGE THIS
        opts.agreeTos = true;
      }
      cb(null, { options: opts, certs: certs });
    }             // CHANGE THIS
  , configDir: '~/.config/acme/'
  , app: App
  , communityMember: true
  //, debug: true
  }).listen(8082, 8081);
}
else
{
  App.listen(config.port, (err: Error) => {
    if (err) {
        console.log('Error: ', err)
    }
    return console.log(`Server is listening on ${config.port}`)
  })
}

import * as express from 'express'
import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
const web3 = new Web3("ws://localhost:8546");

class App {
    public express

    constructor () {
        this.express = express()
        this.mountRoutes()
    }

    private mountRoutes(): void {
        const router = express.Router()
        router.get('/', (req, res) => {
            res.json({
                message: 'Hello World!'
            })
        })
        this.express.use('/', router)
    }
}

export default new App().express
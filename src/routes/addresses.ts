const express = require('express')
const router = express.Router()
import * as app from './../app'

router.get('/', async (req, res) => {
    res.send(
        'Hello world!'
    )
})

router.get('/addresses/', async (req, res) => {
    res.send(
        'Please specify an address!'
    )
})

router.get('/addresses/:id', async (req, res) => {
    res.send({
        tx_in: await app.tx_get_connections_in(req.params.id),
        tx_out: await app.tx_get_connections_out(req.params.id),
    })
})

module.exports = router

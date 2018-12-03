const express = require('express')
const router = express.Router()
import * as app from './../app'

router.get('/', async (req, res) => {
    res.send(
        'Hello world!'
    )
})

router.get('/addresses/', async (req, res) => {
    res.send({
        tx_in: await app.tx_get_connections_in('0xfE03e5d2aDBddDa0B6F4c92a21c916442D629591'),
        tx_out: await app.tx_get_connections_out('0xfE03e5d2aDBddDa0B6F4c92a21c916442D629591'),
    })
})

router.get('/addresses/:id', async (req, res) => {
    res.send({
        tx_in: await app.tx_get_connections_in(req.params.id),
        tx_out: await app.tx_get_connections_out(req.params.id),
    })
})

router.get('/add/:id', async (req, res) => {
    res.send({
        tx_in: await app.tx_get_connections_in_aggr(req.params.id),
        tx_out: await app.tx_get_connections_out_aggr(req.params.id),
    })
})

module.exports = router

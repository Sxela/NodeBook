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
        total_in: await app.tx_get_total_connections_in(req.params.id),
        total_out: await app.tx_get_total_connections_out(req.params.id),
        tx_in: await app.tx_get_connections_in(req.params.id),
        tx_out: await app.tx_get_connections_out(req.params.id),
        aliases: await app.get_address_aliases(req.params.id)
    })
})

router.get('/addresses/in/:id', async (req, res) => {
    
    res.send({
        total_in: await app.tx_get_total_connections_in(req.params.id),
        tx_in: await app.tx_get_connections_in(req.params.id),
        aliases: await app.get_address_aliases(req.params.id)
    })
})

router.get('/addresses/out/:id', async (req, res) => {
    
    res.send({
        total_out: await app.tx_get_total_connections_out(req.params.id),
        tx_out: await app.tx_get_connections_out(req.params.id),
        aliases: await app.get_address_aliases(req.params.id)
    })
})

router.get('/addresses/out/:id/:block', async (req, res) => {
    
    res.send({
        total_out: await app.tx_get_total_connections_out_after_blk(req.params.id, parseInt(req.params.block)),
        tx_out: await app.tx_get_connections_out_after_blk(req.params.id, parseInt(req.params.block)),
        aliases: await app.get_address_aliases(req.params.id)
        
    });
})

router.get('/addresses/in/:id/:block', async (req, res) => {
    
    res.send({
        total_in: await app.tx_get_total_connections_in_before_blk(req.params.id, parseInt(req.params.block)),
        tx_in: await app.tx_get_connections_in_before_blk(req.params.id, parseInt(req.params.block)),
        aliases: await app.get_address_aliases(req.params.id)
        
    });
})

router.get('/getblocks/:begin/:end', async (req, res) => {
    app.addBlocks_batch(req.params.begin,req.params.end, 20, 10);
})




module.exports = router

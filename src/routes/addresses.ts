const express = require('express')
const router = express.Router()
import * as app from './../app'
import * as app_chs from './../app_chs_apla'


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

// mongo hass been edited out and will be removed in next versions. you can return it by renaming all the app_chs. lines to app.

router.get('/addresses/:id', async (req, res) => {
    
    res.send({
    //   total_in: await app.tx_get_total_connections_in(req.params.id),
    //    total_out: await app.tx_get_total_connections_out(req.params.id),
    //    tx_in: await app.tx_get_connections_in(req.params.id),
    //    tx_out: await app.tx_get_connections_out(req.params.id),
        total_in: await app_chs.tx_get_total_incoming_connections(req.params.id),
        total_out: await app_chs.tx_get_total_outgoing_connections(req.params.id),
        tx_in: await app_chs.tx_get_incoming_connections(req.params.id),
        tx_out: await app_chs.tx_get_outgoing_connections(req.params.id),
        aliases: await app.get_address_aliases(req.params.id)
    })
})


router.get('/addresses/out/:id/:block', async (req, res) => {
    
    res.send({
      //  total_out: await app.tx_get_total_connections_out_after_blk(req.params.id, parseInt(req.params.block)),
      //  tx_out: await app.tx_get_connections_out_after_blk(req.params.id, parseInt(req.params.block)),
        total_out: await app_chs.tx_get_total_outgoing_connections_after_blk(req.params.id, parseInt(req.params.block)),
        tx_out: await app_chs.tx_get_outgoing_connections_after_blk(req.params.id, parseInt(req.params.block)),
        aliases: await app.get_address_aliases(req.params.id)
        
    });
})

router.get('/addresses/in/:id/:block', async (req, res) => {
    
    res.send({
    //    total_in: await app.tx_get_total_connections_in_before_blk(req.params.id, parseInt(req.params.block)),
    //    tx_in: await app.tx_get_connections_in_before_blk(req.params.id, parseInt(req.params.block)),
        total_in: await app_chs.tx_get_total_incoming_connections_before_blk(req.params.id, parseInt(req.params.block)),
        tx_in: await app_chs.tx_get_incoming_connections_before_blk(req.params.id, parseInt(req.params.block)),
        aliases: await app.get_address_aliases(req.params.id)
        
    });
})


router.get('/getblocks/:begin/:end', async (req, res) => {
    //addblocks is disabled for production by default
    //app.addBlocks_batch(req.params.begin,req.params.end, 100, 10);
})




module.exports = router

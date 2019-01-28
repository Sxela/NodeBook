import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
import * as db_block from './controllers/eth_Block_controller';
import eth_Block from "./models/eth_Block";
import eth_Tx_full from "./models/eth_Tx_full";
import config = require('./config/config');
import eth_Alias from "./models/eth_Alias";
import * as scrapper from './services/scrapper'

var tress = require('tress');

let web3 = new Web3(new Web3.providers.HttpProvider(config.web3Provider));


export async function addBlocks(startblock, endblock) //add blocks + transactions 
{
    let date = Date();
    let numblocks; 
    await eth_Block.estimatedDocumentCount().then(count=> {console.log('Current # of blocks in db: '+count); numblocks = count});
    let numtxs;
    await eth_Tx_full.estimatedDocumentCount().then(count=> {console.log('Current # of txs in db: '+count); numtxs = count});

    let latestblock = await web3.eth.getBlockNumber();
    if (endblock > latestblock)
    { 
        console.log("Error: Block #" +  endblock + " doesn't exist yet! Replacing with current block: #"+ latestblock); 
        endblock =  latestblock;
    }
   for (let i=startblock;i<=endblock;i++) 
    {
        if (i % 100 == 0) console.log('checking block #'+i);
         await db_block.getBlock(i);

         if (i == endblock-1) 
         {
            console.log(date);
            console.log(Date());}

        
    }
    await eth_Block.estimatedDocumentCount().then(count=> 
        {
            numblocks=count-numblocks;
            console.log('Added '+ numblocks+' new blocks')
        });
    await eth_Tx_full.estimatedDocumentCount().then(count=> 
        {
            numtxs=count-numtxs;
            console.log('Added ' +numtxs+ ' new txes')
        });
    console.log(date)
    console.log(Date())
}

export async function addBlocks_batch(startblock, endblock, batch, threads = 6) //add blocks + transactions 
{
    async function getBatch(startblock, endblock)
    {
        for (let j = startblock; j<=endblock; j++)
        {
            if (j % 100 == 0) console.log('checking block #'+j);
            await db_block.getBlock(j);
        }
    }

    var q = tress(async function(batch, callback){
        console.log('running batch' + batch.startblock + '-' +batch.endblock);
        await getBatch(batch.startblock, batch.endblock)
        callback()
    }, threads);

    q.drain = async function(){
        console.log(date);
        var date2 = new Date()
        var delta = (date2.valueOf() - date1.valueOf()) / 1000;
        console.log(Date());
        console.log('Added in '+ delta+' seconds');
        await eth_Block.estimatedDocumentCount().then(count=> 
            {
                numblocks=count-numblocks;
                console.log('Added '+ numblocks+' new blocks, at '+ numblocks/delta + ' blocks/s')
            });
        await eth_Tx_full.estimatedDocumentCount().then(count=> 
            {
                numtxs=count-numtxs;
                console.log('Added ' +numtxs+ ' new txes, at ' + numtxs/delta + ' tx/s')
            });
    }

    var date1 = new Date()
    var date = Date()
    
    let numblocks; 
    await eth_Block.estimatedDocumentCount().then(count=> {console.log('Current # of blocks in db: '+count); numblocks = count});
    let numtxs;
    await eth_Tx_full.estimatedDocumentCount().then(count=> {console.log('Current # of txs in db: '+count); numtxs = count});

    let latestblock = await web3.eth.getBlockNumber();
    if (endblock > latestblock)
    { 
        console.log("Error: Block #" +  endblock + " doesn't exist yet! Replacing with current block: #"+ latestblock); 
        endblock =  latestblock;
    }
   for (let i=startblock;i<=endblock;i+=batch) 
    {
        q.push({startblock: i, endblock : i+batch})
    }
}

async function convert_tx_value()
{

let count = 1000000;
let batchsize = 100; //taking results in batches;
    for (let i = 0;i<=count;i+=batchsize)
    {

       await eth_Tx_full.find({'value':{$type:"string"}}).skip(i).limit(batchsize).exec((err,res)=>
        {
            res.forEach(function(doc)
                { 
                    var amountInt : Number = doc.value*1;
                    if (i % 100 == 0 ){console.log(i)}
                    eth_Tx_full.updateOne({_id: doc._id}, {$set: {"value": amountInt}}, (err,res)=>{if (err) console.log(err)});
                })
        })
    }
}



export async function tx_get_connections_out(address) //get connections from a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx_full.aggregate([
        {
            $match: 
            {'from': address}
        },
        {
            $group:
            { 
                _id: "$to",
                Txes: { $sum: 1 },
                value: { $sum : "$value"}, 
                firstBlock: { $min : "$blockNumber"},
                //lastBlock: { $max : "$blockNumber"}          
            }
        }
    ])
    .sort({value: 'desc'})
    .limit(20)
}

export async function tx_get_connections_out_after_blk(address, block) //get connections from a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx_full.aggregate([
        {
            $match: 
        { 
            $and: [
            {'from': address},
            {'blockNumber': {$gte : block}}
            ]
        }
        },
        {
            $group:
            { 
                _id: "$to",
                Txes: { $sum: 1 },
                value: { $sum : "$value"}, 
                firstBlock: { $min : "$blockNumber"},
                //lastBlock: { $max : "$blockNumber"}          
            }
        }
    ])
    .sort({value: 'desc'})
    .limit(20)
}

export async function tx_get_total_connections_out(address) //get total num of connections from a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx_full.aggregate([
        {
            $match: 
            {'from': address}
        },
        {
            $group:
            { 
                _id: "$to",
                Txes: { $sum: 1 },
                value: { $sum : "$value"}            
            }
            
        },
        {
            $group:
            { 
                _id: null,
                links: { $sum: 1 },
                value: { $sum : "$value"}            
            }
        }
    ])
}

export async function tx_get_total_connections_out_after_blk(address, block) //get total num of connections from a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx_full.aggregate([
        {
            $match: 
            { 
                $and: [
                {'from': address},
                {'blockNumber': {$gte : block}}
                ]
            }
        },
        {
            $group:
            { 
                _id: "$to",
                Txes: { $sum: 1 },
                value: { $sum : "$value"}            
            }
            
        },
        {
            $group:
            { 
                _id: null,
                links: { $sum: 1 },
                value: { $sum : "$value"}            
            }
        }
    ])
}

export async function tx_get_connections_in_before_blk(address, block) //get connections to a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx_full.aggregate([
        {
            $match: 
        { 
            $and: [
            {'to': address},
            {'blockNumber': {$lte : block}}
            ]
        }
        },
        {
            $group:
            { 
                _id: "$from",
                Txes: { $sum: 1 },
                value: { $sum : "$value"}, 
                //firstBlock: { $min : "$blockNumber"},
                lastBlock: { $max : "$blockNumber"}          
            }
        }
    ])
    .sort({value: 'desc'})
    .limit(20)
    //.explain()
    //.then(console.log);
}

export async function tx_get_connections_in(address) //get connections to a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx_full.aggregate([
        {
            $match: 
            {'to': address}
        },
        {
            $group:
            { 
                _id: "$from",
                Txes: { $sum: 1 },
                value: { $sum : "$value"} ,
                lastBlock: { $max : "$blockNumber"}           
            }
        }
    ])
    .sort({value: 'desc'})
    .limit(20)
}

export async function tx_get_total_connections_in_before_blk(address, block) //get connections to a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx_full.aggregate([
        {
            $match: 
            { 
                $and: [
                {'to': address},
                {'blockNumber': {$lte : block}}
                ]
            }
        },
        {
            $group:
            { 
                _id: "$from",
                Txes: { $sum: 1 },
                value: { $sum : "$value"}            
            }
            
        },
        {
            $group:
            { 
                _id: null,
                links: { $sum: 1 },
                value: { $sum : "$value"}            
            }
        }
    ])
    
}

export async function tx_get_total_connections_in(address) //get connections to a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx_full.aggregate([
        {
            $match: 
            {'to': address}
        },
        {
            $group:
            { 
                _id: "$from",
                Txes: { $sum: 1 },
                value: { $sum : "$value"}            
            }
        },
        {
            $group:
            { 
                _id: null,
                links: { $sum: 1 },
                value: { $sum : "$value"}            
            }
        }
    ])
}

export async function get_address_aliases(address)
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Alias.find({'address':address})
}

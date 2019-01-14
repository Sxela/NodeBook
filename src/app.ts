import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
import * as db_block from './controllers/eth_Block_controller';
import eth_Block from "./models/eth_Block";
import eth_Tx from "./models/eth_Tx";
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
    await eth_Tx.estimatedDocumentCount().then(count=> {console.log('Current # of txs in db: '+count); numtxs = count});

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
    await eth_Tx.estimatedDocumentCount().then(count=> 
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
        await eth_Tx.estimatedDocumentCount().then(count=> 
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
    await eth_Tx.estimatedDocumentCount().then(count=> {console.log('Current # of txs in db: '+count); numtxs = count});

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

       await eth_Tx.find({'transaction.value':{$type:"string"}}).skip(i).limit(batchsize).exec((err,res)=>
        {
            res.forEach(function(doc)
                { 
                    var amountInt : Number = doc.transaction.value*1;
                    if (i % 100 == 0 ){console.log(i)}
                    eth_Tx.updateOne({_id: doc._id}, {$set: {"transaction.value": amountInt}}, (err,res)=>{if (err) console.log(err)});
                })
        })
    }
}



export async function tx_get_connections_out(address) //get connections from a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx.aggregate([
        {
            $match: 
            {'transaction.from': address}
        },
        {
            $group:
            { 
                _id: "$transaction.to",
                Txes: { $sum: 1 },
                value: { $sum : "$transaction.value"}, 
                firstBlock: { $min : "$transaction.blockNumber"},
                //lastBlock: { $max : "$transaction.blockNumber"}          
            }
        }
    ])
    .sort({value: 'desc'})
    .limit(20)
}

export async function tx_get_connections_out_after_blk(address, block) //get connections from a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx.aggregate([
        {
            $match: 
        { 
            $and: [
            {'transaction.from': address},
            {'transaction.blockNumber': {$gte : block}}
            ]
        }
        },
        {
            $group:
            { 
                _id: "$transaction.to",
                Txes: { $sum: 1 },
                value: { $sum : "$transaction.value"}, 
                firstBlock: { $min : "$transaction.blockNumber"},
                //lastBlock: { $max : "$transaction.blockNumber"}          
            }
        }
    ])
    .sort({value: 'desc'})
    .limit(20)
}

export async function tx_get_total_connections_out(address) //get total num of connections from a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx.aggregate([
        {
            $match: 
            {'transaction.from': address}
        },
        {
            $group:
            { 
                _id: "$transaction.to",
                Txes: { $sum: 1 },
                value: { $sum : "$transaction.value"}            
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
    return await eth_Tx.aggregate([
        {
            $match: 
            { 
                $and: [
                {'transaction.from': address},
                {'transaction.blockNumber': {$gte : block}}
                ]
            }
        },
        {
            $group:
            { 
                _id: "$transaction.to",
                Txes: { $sum: 1 },
                value: { $sum : "$transaction.value"}            
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
    return await eth_Tx.aggregate([
        {
            $match: 
        { 
            $and: [
            {'transaction.to': address},
            {'transaction.blockNumber': {$lte : block}}
            ]
        }
        },
        {
            $group:
            { 
                _id: "$transaction.from",
                Txes: { $sum: 1 },
                value: { $sum : "$transaction.value"}, 
                //firstBlock: { $min : "$transaction.blockNumber"},
                lastBlock: { $max : "$transaction.blockNumber"}          
            }
        }
    ])
    .sort({value: 'desc'})
    .limit(20)
}

export async function tx_get_connections_in(address) //get connections to a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx.aggregate([
        {
            $match: 
            {'transaction.to': address}
        },
        {
            $group:
            { 
                _id: "$transaction.from",
                Txes: { $sum: 1 },
                value: { $sum : "$transaction.value"} ,
                lastBlock: { $max : "$transaction.blockNumber"}           
            }
        }
    ])
    .sort({value: 'desc'})
    .limit(20)
}

export async function tx_get_total_connections_in_before_blk(address, block) //get connections to a given address from tx db
{
    address = Web3.utils.toChecksumAddress(address)
    return await eth_Tx.aggregate([
        {
            $match: 
            { 
                $and: [
                {'transaction.to': address},
                {'transaction.blockNumber': {$lte : block}}
                ]
            }
        },
        {
            $group:
            { 
                _id: "$transaction.from",
                Txes: { $sum: 1 },
                value: { $sum : "$transaction.value"}            
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
    return await eth_Tx.aggregate([
        {
            $match: 
            {'transaction.to': address}
        },
        {
            $group:
            { 
                _id: "$transaction.from",
                Txes: { $sum: 1 },
                value: { $sum : "$transaction.value"}            
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


//test polygon --------------------------------------------------------------------------------------------------
//0xb854bf62681303653c461Efa5Cd8E7555230E628
//0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8 ethermint


//next : 4217082-4281112


async function test(){
//console.log( await tx_get_total_connections_out_after_blk('0x1CF6b3CFeB7E14E917a28E3e52b183A6d4FEe24c', 0))
//console.log( await tx_get_connections_out_after_blk('0x1CF6b3CFeB7E14E917a28E3e52b183A6d4FEe24c', 0))
//console.log( await get_address_aliases('0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8'));
//console.log( await tx_get_connections_in_before_blk('0x1CF6b3CFeB7E14E917a28E3e52b183A6d4FEe24c',80000000) )
//console.log( await tx_get_connections_in('0x1CF6b3CFeB7E14E917a28E3e52b183A6d4FEe24c') )
//console.log( await tx_get_total_connections_in_before_blk('0x1CF6b3CFeB7E14E917a28E3e52b183A6d4FEe24c',80000000) )
//web3.eth.getTransactionReceipt('0xcc2e45aa1b8ebdf248c70bb1727664e4e308e6eb866cd175d8f930dae9cf5be7').then(console.log);
//0xc9505b49ed8e40bd81f87c12c94938579abcda93
console.log( await tx_get_connections_in('0x3AA5FA4FBF18d19548680a5f2BbA061b18Fed26b') )
console.log( await tx_get_connections_out('0x3AA5FA4FBF18d19548680a5f2BbA061b18Fed26b'))
console.log( await get_address_aliases('0x3aa5fa4fbf18d19548680a5f2bba061b18fed26b'));
}

//addBlocks_batch(4210000,4220000,100,20)
//addBlocks_batch(4220000,4230000,20,6)
//addBlocks_batch(4230000,4231000,20,6)
//addBlocks_batch(4231000,4232000,20,10)
//addBlocks_batch(4232000,4240000,20,10)
//addBlocks_batch(4200000,4210000,20,6)
//addBlocks_batch(4100000,4163000,20,6)
//addBlocks_batch(4163000,4180000,20,6)
//addBlocks(4180020,4180025)
//addBlocks_batch(4180000,4180100,20,6)
//addBlocks_batch(4180100,4181000,20,6)
//addBlocks_batch(4181000,4190000,20,6)
//addBlocks_batch(4190000,4200000,20,6) // 10b/s
//addBlocks_batch(4240000,4250000,50,10) //11b/s
//addBlocks_batch(4250000,4260000,20,5) //8 b/s
//addBlocks_batch(4260000,4270000,20,10) //11 b/s
//addBlocks_batch(4275001,4280000,20,10) //11 b/s
//addBlocks_batch(4280000,4290000,20,10) //12 b/s
//test()

//scrapper
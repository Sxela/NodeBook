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

export async function addBlocks_batch(startblock, endblock, batch) //add blocks + transactions 
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
    }, 6);

    q.drain = async function(){
        console.log(date);
        console.log(Date());
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
    }

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
   for (let i=startblock;i<=endblock;i+=batch) 
    {
    //    console.log('checking batch #' + (i-startblock)/batch)
    //    getBatch(i, i+batch)
    q.push({startblock: i, endblock : i+batch})
    //    if (i+batch >= endblock-1) 
    //        {
     //           
     //       }
    }
    
    //console.log(date)
    //console.log(Date())
    
}

async function convert_tx_value()
{
//let count = await eth_Tx.estimatedDocumentCount();
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
    var string = address
    string = string.toLowerCase();
    return await eth_Alias.find({'address':string})
}


//test polygon
//0xb854bf62681303653c461Efa5Cd8E7555230E628
//0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8 ethermint

//addBlocks(6000000,6010000);
//addBlocks(6010000,6020000);
//addBlocks(6020000,6040000);
//addBlocks(6040000,6060000);
//next : 4217082-4281112
//addBlocks(6060000,6064300);
//addBlocks_batch(6064300,6064500,5)
//addBlocks_batch(6064500,6064700,5)
//addBlocks_batch(6064700,6064900,5)
//addBlocks_batch(6064900,6065000,5)
//addBlocks_batch(4210000,4210100,5)
//addBlocks_batch(4210100,4210300,5) // 47 sec - 2 threads
//addBlocks(4210300,4210500); 75 sec 
//addBlocks_batch(4210500,4210700,5) //26 sec - 4 threads
//addBlocks_batch(4210700,4210900,10) // 21 sec 4 threads
//addBlocks_batch(4211100,4211300,5) // 6 threads // 20 sec
//addBlocks_batch(4217000,4218000,20) //6 threads // 105 sec
//addBlocks_batch(4218000,4219000,20) //10 threads // 105 sec 
//addBlocks_batch(4219000,4229000,20)
async function test(){
console.log( await tx_get_total_connections_out_after_blk('0x1CF6b3CFeB7E14E917a28E3e52b183A6d4FEe24c', 0))
console.log( await tx_get_connections_out_after_blk('0x1CF6b3CFeB7E14E917a28E3e52b183A6d4FEe24c', 0))
console.log( await get_address_aliases('0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8'));
console.log( await tx_get_connections_in_before_blk('0x1CF6b3CFeB7E14E917a28E3e52b183A6d4FEe24c',80000000) )
console.log( await tx_get_connections_in('0x1CF6b3CFeB7E14E917a28E3e52b183A6d4FEe24c') )
console.log( await tx_get_total_connections_in_before_blk('0x1CF6b3CFeB7E14E917a28E3e52b183A6d4FEe24c',80000000) )
}

test()

//scrapper
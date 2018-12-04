import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
import * as db_block from './controllers/eth_Block_controller';
import eth_Block from "./models/eth_Block";
import eth_Tx from "./models/eth_Tx";
import config = require('./config/config');

let web3 = new Web3(new Web3.providers.HttpProvider(config.web3Provider));

type entry = [string, number, number];

async function addBlocks(startblock, endblock) //add blocks + transactions 
{
    let date = Date();
    let numblocks; 
    await eth_Block.countDocuments().then(count=> {console.log('Current # of blocks in db: '+count); numblocks = count});
    let numtxs;
    await eth_Tx.countDocuments().then(count=> {console.log('Current # of txs in db: '+count); numtxs = count});

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
    await eth_Block.countDocuments().then(count=> 
        {
            numblocks=count-numblocks;
            console.log('Added '+ numblocks+' new blocks')
        });
    await eth_Tx.countDocuments().then(count=> 
        {
            numtxs=count-numtxs;
            console.log('Added ' +numtxs+ ' new txes')
        });
    console.log(date)
    console.log(Date())
    
}

//test polygon
//0xb854bf62681303653c461Efa5Cd8E7555230E628
//0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8 ethermint

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

//addBlocks(6000000,6010000);

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
                value: { $sum : "$transaction.value"}            
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
                value: { $sum : "$transaction.value"}            
            }
        }
    ])
    .sort({value: 'desc'})
    .limit(20)
}

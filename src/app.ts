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

async function tx_get_connections(address) //get connections to a given address from tx db
{
let date = Date();
let to = new Array<entry>();
let from = new Array<entry>();

await eth_Tx.find({'transaction.from': address}, async (err, txs2)=>{
    await txs2.forEach( element2 => {
        var index = to.findIndex(row => row[0] === element2.transaction.to);
                            if (index == -1 ) {to.push([element2.transaction.to, element2.transaction.value/1000000000000000000, 1])}
                            else //if address found - add value and tx count
                            {
                            to[index][1]+=element2.transaction.value/1000000000000000000;
                            to[index][2]+=1;
                            }   
                     
    });
});

await eth_Tx.find({'transaction.to': address}, async (err, txs)=>{
    await txs.forEach( element => {
       var index = from.findIndex(row => row[0] === element.transaction.from); //if address is not found in the array - add address + tx value
                       if (index == -1 ) { from.push([element.transaction.from, element.transaction.value/1000000000000000000, 1])} 
                       else //if address found - add value and tx count
                       {
                           from[index][1]+=element.transaction.value/1000000000000000000;
                           from[index][2]+=1;
                       } 
    });
});
console.log('\naddress ' + address +'\n\nhas sent to \n');
console.log( to);
console.log('\n\nand has received from \n');
console.log( from);

    
console.log(date)
console.log(Date());
return {"to":to,"from":from};
}

export async function tx_get_connections_out(address) //get connections to a given address from tx db
{
let to = new Array<entry>();

await eth_Tx.find({'transaction.from': address}, 'transaction.to transaction.value', async (err, txs2)=>{
     txs2.forEach( element2 => {
        var index = to.findIndex(row => row[0] === element2.transaction.to);
                            if (index == -1 ) {to.push([element2.transaction.to, element2.transaction.value/1000000000000000000, 1])}
                            else //if address found - add value and tx count
                            {
                            to[index][1]+=element2.transaction.value/1000000000000000000;
                            to[index][2]+=1;
                            }   
                     
    });
});
return to;
}

export async function tx_get_connections_in(address) //get connections to a given address from tx db
{
let from = new Array<entry>();

await eth_Tx.find({'transaction.to': address}, 'transaction.from transaction.value', async (err, txs)=>{
    txs.forEach( element => {
       var index = from.findIndex(row => row[0] === element.transaction.from); //if address is not found in the array - add address + tx value
                       if (index == -1 ) { from.push([element.transaction.from, element.transaction.value/1000000000000000000, 1])} 
                       else //if address found - add value and tx count
                       {
                           from[index][1]+=element.transaction.value/1000000000000000000;
                           from[index][2]+=1;
                       } 
    });
});
return from;
}


//test polygon
//0xb854bf62681303653c461Efa5Cd8E7555230E628
//0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8 ethermint

async function test (address) {
await eth_Tx.find({'transaction.from': address},  async (err, txs)=>{
    //console.log(txs.length);
    //console.log(await tx_get_connections_in(0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8));
}
).limit(100);

};

test(0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8);
eth_Tx.find({'transaction.from': '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8'},  (err, txs)=>{
    //console.log(txs.length);
}
).limit(100);

eth_Tx.find({'transaction.from': '0xb854bf62681303653c461Efa5Cd8E7555230E628'}, 'transactions.to transactions.value').count().exec((err,count)=>
{
    let to = new Array<entry>();
    let batchsize = 1000; //taking results in batches;
    for (let i = 0;i<=count;i+=batchsize)
    {
        eth_Tx.find({'transaction.from': '0xb854bf62681303653c461Efa5Cd8E7555230E628'}).skip(i).limit(batchsize).exec((err,res)=>
        {

            res.forEach( element2 => {
                var index = to.findIndex(row => row[0] === element2.transaction.to);
                                    if (index == -1 ) {to.push([element2.transaction.to, element2.transaction.value/1000000000000000000, 1])}
                                    else //if address found - add value and tx count
                                    {
                                    to[index][1]+=element2.transaction.value/1000000000000000000;
                                    to[index][2]+=1;
                                    }   
                             
            });
            //console.log(res.length + ' from batch '+i);
            //console.log(to);
        });
    }
    //console.log('count '+count)
    return to;
})


eth_Tx.aggregate([
    {
        $match: 
        {'transaction.from': '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8'}
    },
    {
        $group:
        { 
            _id: "$transaction.to",
            Txes: { $sum: 1 },
            value: { $sum : "$transaction.value"}            
        }
    }
]).exec((err,res)=>{
//console.log(res);
return res;
})

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

//convert_tx_value();
//console.log(1)
//db_block.getBlock(6000000);
//addBlocks(6000000,6010000);

export async function tx_get_connections_out_aggr(address) //get connections from a given address from tx db
{
    let aggr = await eth_Tx.aggregate([
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
    ]).limit(20).exec(async (err,res)=>{
        console.log(res);
    })
    return aggr;
}

export async function tx_get_connections_in_aggr(address) //get connections to a given address from tx db
{
    let aggr;
    await eth_Tx.aggregate([
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
    ]).limit(20).exec((err,res)=>{
    })
}

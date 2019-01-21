import eth_tx_full from '../models/eth_Tx_full'
import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
import config = require('../config/config');
let web3 = new Web3(new Web3.providers.HttpProvider(config.web3Provider));


export async function txAdd(transaction: Object)
{
let tx = await new eth_tx_full(transaction)
tx.save(async (err:any, tx2:any) =>
{
    if (err) 
        {
           // console.log('Error! ' + err);       
        }
    else
    {
         //console.log(await tx.hash + ' added successfully. From ' + await tx.to + ' to ' + await tx.to + ' for ' + await tx.value );
    }
})
} 

export async function txAdd_bulk(transactions)
{
    //console.log(transactions.length)
    eth_tx_full.insertMany(transactions, { ordered: false }, (err, res) => {});
} 


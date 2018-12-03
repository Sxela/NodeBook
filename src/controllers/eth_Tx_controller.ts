import eth_tx from '../models/eth_Tx'
import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
import config = require('./../config/config');
let web3 = new Web3(new Web3.providers.HttpProvider(config.web3Provider));


export async function txAdd(transaction: Object)
{
let tx = await new eth_tx({transaction:transaction})
tx.save(async (err:any, tx2:any) =>
{
    if (err) 
        {
            //console.log('Error! ' + err);       
        }
    else
    {
         //console.log(await tx.hash + ' added successfully. From ' + await tx.to + ' to ' + await tx.to + ' for ' + await tx.value );
    }
})
} 


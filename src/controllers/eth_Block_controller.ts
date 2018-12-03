
import eth_Block from '../models/eth_Block'
import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
import { txAdd } from './eth_Tx_controller';
import config = require('./../config/config');
let web3 = new Web3(new Web3.providers.HttpProvider(config.web3Provider));

export async function getBlock(num:Number) // returns 1 eth block
{
    
        
    let block = await eth_Block.find({eth_block_number:num}, 'eth_block', async (err:any, result:any) =>
    {
        if (err) 
        {
            console.log('Error!' + err);
        }
        else 
        {
           
        }    
    })
     
if (block[0] == null) //if block was not found, download it
{  
    if ((num % 100) == 0) {console.log('Block not found, fetching.')}
    const newblock = await web3.eth.getBlock(num,true)
    block = new eth_Block({eth_block:newblock, eth_block_number:newblock.number});
    await block.save( (err:any, block3:any) =>
                    {
                        if (err) 
                            {console.log('Error! ' + err);}
                        else
                        {
                             console.log(newblock.number + ' added successfully. Contains ' + newblock.transactions.length + ' txes. Nonce:' + newblock.nonce );
                                 // add txes when block is not found, to add new txes 
                             newblock.transactions.forEach(element => {
                                txAdd(element);    
                                });
                        }
                    })
    return newblock    
               
}
else 
{
    if ((num % 100) == 0) {console.log('Block found: ' + block[0].eth_block.number + '. Contains ' + block[0].eth_block.transactions.length + ' txes. Nonce:' + block[0].eth_block.nonce);}
    block[0].eth_block.transactions.forEach(element => {
        txAdd(element);    
        });
}

return block[0].eth_block
}

export async function AddExistingBlocks()
{
    let blocks = await eth_Block.find({}, 'eth_block', async (err:any, result:any) =>
    {
        if (err) 
        {
            console.log('Error!' + err);
        }
        else 
        {
           await result.forEach(async element => {
               console.log('adding ' + await element.eth_block.transactions.length + 'transactions from block #' + await element.eth_block.number)
               await element.eth_block.transactions.forEach( async tx=>{
                   console.log('added tx #' + tx.hash + "n/" + tx);
                    await txAdd(tx);
               })
           });
        }    
    })
}

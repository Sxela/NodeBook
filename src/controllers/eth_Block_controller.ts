
import eth_Block from './../eth_Block'
import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
let web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/25c667224edd406e857d23c6e4c07bc4"));

export async function getBlock(num:Number) 
{
    
        
    let block = await eth_Block.find({eth_block_number:num}, 'eth_block', async (err:any, result:any) =>
    {
        if (err) 
        {
            console.log('Error!' + err);
        }
        else 
        {}    
    })
     
if (block[0] == null) //if block was not found, download it
{  
    console.log('Block not found, fetching.')
    const newblock = await web3.eth.getBlock(num,true)
    block = new eth_Block({eth_block:newblock, eth_block_number:newblock.number});
    await block.save(async (err:any, block3:any) =>
                    {
                        if (err) 
                            {console.log('Error! ' + err);}
                        else
                        {
                             console.log(newblock.number + ' added successfully. Contains ' + newblock.transactions.length + ' txes. Nonce:' + newblock.nonce );
                        }
                    })
    return newblock    
               
}
else {console.log('Block found: ' + block[0].eth_block.number + '. Contains ' + block[0].eth_block.transactions.length + ' txes. Nonce:' + block[0].eth_block.nonce);}

return block[0].eth_block
}


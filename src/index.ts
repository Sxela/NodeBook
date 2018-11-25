
import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
import * as db_block from './controllers/eth_Block_controller';
let web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/"));





//scan block and add connections to a given address, storing value of any connection
async function get_connections(i, address, to_arr, from_arr)
{
        const blk = await db_block.getBlock(i);
        blk.transactions.forEach(tx => 
                {
                    if(tx.to == address) //if desired address is found as recipient
                    {
                        //check address array for duplicates before adding
                        var index = from_arr.findIndex(row => row[0] === tx.from); //if address is not found in the array - add address + tx value
                        if (index == -1 ) {from_arr.push([tx.from, tx.value/1000000000000000000, 1])} 
                        else //if address found - add value 
                        {
                            from_arr[index][1]+=tx.value/1000000000000000000;
                            from_arr[index][2]+=1;
                        } 
                    }    
                    else  
                    {       
                        if(tx.from == address) //if desired address is found as sender
                        {
                            var index = to_arr.findIndex(row => row[0] === tx.to);
                            if (index == -1 ) {to_arr.push([tx.to, tx.value/1000000000000000000, 1])}
                            else //if address found - add value 
                            {
                            to_arr[index][1]+=tx.value/1000000000000000000;
                            to_arr[index][2]+=1;
                            }   
                        }
                    }
                })
       
    
}


type entry = [string, number, number];

//search a range of blocks for an address
async function search_address(startblock, endblock, address)
{
    console.log(Date())

    if (endblock > await web3.eth.getBlockNumber())
    { 
        console.log("Error: Block #" + endblock + " doesn't exist yet! Replacing with current block: #"+ await web3.eth.getBlockNumber()); 
        endblock = await web3.eth.getBlockNumber();
    }

    let to = new Array<entry>();
    let from = new Array<entry>();
    for (let i=startblock;i<=endblock;i++)
    {
        if (i % 100 == 0) console.log('checking block #'+i);
        await get_connections(i, address, to, from);
    }
    console.log('\naddress ' + address +'\n\nhas sent to \n');
    console.log(to);
    console.log('\n\nand has received from \n');
    console.log(from);

    console.log(Date())

}

search_address(	6768542,	6768577+500,'0x59a5208B32e627891C389EbafC644145224006E8');

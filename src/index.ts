import * as express from 'express'
import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
let web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/"));

let addresses = new Array<string>();


//read a block and add all addresses to an array, with check for duplicates
async function get_addresses(i, addresses)
{
    const count = await web3.eth.getBlockTransactionCount(i);
    if (count != 0)
    {
        const blk = await web3.eth.getBlock(i,1);
        blk.transactions.forEach(item => 
                {
                    //check address array for duplicates before adding
                    var index = addresses.findIndex(row => row === item.from);
                    if (index == -1 ) addresses.push(item.from);
                    var index = addresses.findIndex(row => row === item.to);
                    if (index == -1 ) addresses.push(item.to);
                })
       
    }
    else {console.log("block #" + i +" is empty")};
}

//scan block and add connections to a given address, storing value of any connection
async function get_connections(i, address, to_arr, from_arr)
{
   
        const blk = await web3.eth.getBlock(i,1);
        blk.transactions.forEach(tx => 
                {
                    if(tx.to == address) //if desired address is found as recipient
                    {
                    //check address array for duplicates before adding
                    var index = from_arr.findIndex(row => row === tx.from);
                    if (index == -1 ) from_arr.push([tx.from, tx.value/1000000000000000000]) //if address is not found in the array - add address + tx value
                    else //if address found - add value 
                        from_arr[index][1]+=from_arr.value;
                    }

                    if(tx.from == address) //if desired address is found as sender
                    {
                    var index = to_arr.findIndex(row => row === tx.to);
                    if (index == -1 ) to_arr.push([tx.to, tx.value/1000000000000000000])
                    else //if address found - add value 
                        from_arr[index][1]+=to_arr.value;
                    }
                })
       
    
}

//read a range of blocks
async function readblock(startblock, endblock, array)
{
    for (let i=startblock;i<=endblock;i++)
    {
        await get_addresses(i, addresses);
    }
    console.log(addresses);

}

//tuple test
type entry = [string, number];
let test:entry;
test=['test',1];
console.log(test);
let to = new Array<entry>();
to.push(['test',1]);
to.push(['test',2]);
to[1][1]+=2;
console.log(to);


//search a range of blocks for an address
async function search_address(startblock, endblock, address)
{
    let to = new Array<entry>();
    let from = new Array<entry>();
    for (let i=startblock;i<=endblock;i++)
    {
        if (i % 10 == 0) console.log('checking block #'+i);
        await get_connections(i, address, to, from);
    }
    console.log('\naddress ' + address +'\n\nhas sent to \n');
    console.log(to);
    console.log('\n\nand has received from \n');
    console.log(from);


}

//readblock(1728879,1728879+0,addresses);
search_address(6740125,6740125+1,'0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa');
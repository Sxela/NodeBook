import * as express from 'express'
import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
let web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/"));

let addresses = new Array<string>();

class account_entry 
{
    account:string;
    to: Array<string>;
    from: Array<string>;
}

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

//scan block and add connections to a given address
async function get_connections(i, address, to, from)
{
    const count = await web3.eth.getBlockTransactionCount(i);
    if (count != 0)
    {
        const blk = await web3.eth.getBlock(i,1);
        blk.transactions.forEach(item => 
                {
                    if(item.to == address)
                    {
                    //check address array for duplicates before adding
                    var index = from.findIndex(row => row === item.from);
                    if (index == -1 ) from.push(item.from);
                    }
                    if(item.from == address)
                    {
                    var index = to.findIndex(row => row === item.to);
                    if (index == -1 ) to.push(item.to);
                    }
                })
       
    }
    else {console.log("block #" + i +" is empty")};
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
//search a range of blocks for an address
async function search_address(startblock, endblock, address)
{
    let to = new Array<string>();
    let from = new Array<string>();
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
search_address(6735100,6735155,'0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa');

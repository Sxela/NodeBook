import eth_Alias from '../models/eth_Alias'
import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!

export default function aliasAdd(data){

    if (data.address.length == 42) data.address = Web3.utils.toChecksumAddress(data.address, (err,res)=> {if (err) console.log(err); console.log(data)}) //check address length
    
    var alias = new eth_Alias({
        address : data.address,
        tokenName : data.tokenName,
        tokenTicker : data.tokenTicker,
        url : data.url,
        source : data.source
    })
    alias.save((err, res) => {
       // if (err) console.log(err)
    })
}
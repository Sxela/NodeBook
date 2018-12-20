import eth_Alias from '../models/eth_Alias'

export default function aliasAdd(data){
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
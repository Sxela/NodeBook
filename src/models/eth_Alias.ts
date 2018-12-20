
import * as mongoose from 'mongoose';

export const eth_aliasSchema = new mongoose.Schema({
    address: 
    {
      type: String,
      required: true,
      unique: true
    },
    tokenName: 
    {
        type: String
    },
    tokenTicker: 
    {
        type: String
    },
    url: 
    {
        type: String
    },
    source: 
    {
        type: String
    }
  })

const eth_Alias = mongoose.model('eth_Alias',eth_aliasSchema);
export default eth_Alias;



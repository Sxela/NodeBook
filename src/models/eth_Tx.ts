
import * as mongoose from 'mongoose';

export const eth_txSchema = new mongoose.Schema({
    transaction: 
    {
      type: Object,
      required: true,
      unique: true  
    }
  })

const eth_Tx = mongoose.model('eth_Tx',eth_txSchema);
export default eth_Tx;



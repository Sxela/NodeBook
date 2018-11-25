
import * as mongoose from 'mongoose';
let db = require('./database')


export const eth_blockSchema = new mongoose.Schema({
    eth_block: 
    {
      type: Object,
      required: true
      
    },
    eth_block_number: 
    {
        type: Number,
        required: true,
        unique: true
    }
  })

const eth_Block = mongoose.model('eth_Block',eth_blockSchema);
export default eth_Block;




import * as mongoose from 'mongoose';

export const eth_txSchema_full = new mongoose.Schema({
    
  blockHash:
  {
    type: String,
    required: true
  },
  blockNumber:  
  {
    type: Number,
    required: true
     
  },
  from:
  {
    type: String,
    required: true
  },
  gas:
  {
    type: Number,
    required: true
  },
  gasPrice:
  {
    type: String,
    required: true
  },
  hash:
  {
    type: String,
    required: true,
    unique: true 
  },
  input:
  {
    type: String,
    required: true
  },
  nonce:
  {
    type: Number,
    required: true
  },
  r:
  {
    type: String,
    required: true
  },
  s:
  {
    type: String,
    required: true
  },
  to:
  {
    type: String,
    required: true
  },
  transactionIndex:
  {
    type: Number,
    required: true
  },
  v:
  {
    type: String,
    required: true
  },
  value:
  {
    type: Number,
    required: true
  }
})

  

  eth_txSchema_full.pre('aggregate', function() {
    this._startTime = Date.now();
  });
  
  eth_txSchema_full.post('aggregate', function() {
    if (this._startTime != null) {
      console.log('Runtime in MS: ', Date.now() - this._startTime);
    }
  });



const eth_Tx_full = mongoose.model('eth_Tx_full',eth_txSchema_full);

export default eth_Tx_full;




let ClickHouse = require('@apla/clickhouse');
var utils = require('web3-utils');

var ch = new ClickHouse ({host: 'data_chs', port: 8123});
//creating db and table if not existing
async function copy_table()
{
    
}


async function create_db_and_table()
{
    const query_db = `
    CREATE DATABASE IF NOT EXISTS ethereum;
    `
    const query = `
    
    CREATE TABLE IF NOT EXISTS ethereum.transaction_from
    (
        from String, to String, value Float64, timestamp UInt64, txhash String
    ) 
        ENGINE = MergeTree()
        PRIMARY KEY from
        ORDER BY (from, timestamp, to, value)
    `
    ch.query(query_db, (err,res) => {
        if (err) console.log(err)
        else console.log('db created')
    })

    ch.query(query, (err,res) => {
        if (err) console.log(err)
        else console.log('table created')
    })
}

//create_db_and_table(); // create db and tablw if not existing

// add data

export async function insert_data(data){
    
    const query = `
        INSERT INTO ethereum.transaction_to (timestamp, from, to, value, txhash) 

    `
    const stream = ch.query (query, {format: 'TSV'})
    data.forEach(elem=>{
        stream.write ([elem.blockNumber, elem.from, elem.to, elem.value, elem.hash]) // Do write as many times as possible

    })
    
    await stream.end() // And don't forget to finish insert query
}  


export async function deduplicate(){

var query = `OPTIMIZE TABLE ethereum.transaction_to FINAL DEDUPLICATE`;
ch.query(query, (err,res) => {
    if (err) console.log(err)
    else console.log('table optimized')
})
}

//deduplicate()


async function getData(query) {
    var startTime = Date.now();
    var stream = await ch.querying(query, {format: 'JSON'});
    if (startTime != null) {
        console.log('CHS Runtime in MS: ', Date.now() - startTime); }

    
    return stream.data;
    

       
}    

/* ---------------------------------------------------------------------------------
                                        OUTGOING
    --------------------------------------------------------------------------------
*/ 

export async function tx_get_outgoing_connections(address_from) 
/* 

_id
Txes
value
firstBlock
lastBlock

checking all outgoing transactions from address_from that happened after the fist incoming transaction to address_from, 
grouping them by destination address, summing up transactions and values for each destination address */
{
    address_from = utils.toChecksumAddress(address_from)

    const query = `
    SELECT SUM(value) AS value, to AS _id, COUNT(to) AS Txes, MIN(timestamp) AS firstBlock
    FROM ethereum.transaction_from 
    WHERE (from='${address_from}')
    GROUP BY to 
    ORDER BY SUM(value) AS value DESC 
    LIMIT 20
    `
   return await getData(query)
}

export async function tx_get_outgoing_connections_after_blk(address_from, firstBlock) 


/* 

_id
Txes
value
firstBlock
lastBlock

checking all outgoing transactions from address_from that happened after the fist incoming transaction to address_from, 
grouping them by destination address, summing up transactions and values for each destination address */
{
  address_from = utils.toChecksumAddress(address_from)

    const query = `
    SELECT SUM(value) AS value, to AS _id, COUNT(to) AS Txes, MIN(timestamp) AS firstBlock 
    FROM ethereum.transaction_from 
    WHERE (from='${address_from}') AND (timestamp>=${firstBlock}) 
    GROUP BY to 
    ORDER BY SUM(value) AS value DESC 
    LIMIT 20
    `
  return await getData(query)
}

export async function tx_get_total_outgoing_connections(address_from) 
/* 

_id
links
value

checking all outgoing transactions from address_from that happened after the fist incoming transaction to address_from, 
grouping them by destination address, summing up transactions and values for each destination address */
{
  address_from = utils.toChecksumAddress(address_from)

    const query = `
    SELECT COUNT(to) as links, SUM(value) as value FROM 
    (
        SELECT SUM(value) AS value, to, COUNT(to) AS Txes 
        FROM ethereum.transaction_from 
        WHERE (from='${address_from}')
        GROUP BY to  
    )
    `
 return await getData(query)
}

export async function tx_get_total_outgoing_connections_after_blk(address_from, firstBlock) 
/* 

_id
links
value

checking all outgoing transactions from address_from that happened after the fist incoming transaction to address_from, 
grouping them by destination address, summing up transactions and values for each destination address */
{
  address_from = utils.toChecksumAddress(address_from)

    const query = `
    SELECT COUNT(to) as links, SUM(value) as value FROM 
    (
        SELECT SUM(value) AS value, to, COUNT(to) AS Txes 
        FROM ethereum.transaction_from 
        WHERE (from='${address_from}') AND (timestamp>=${firstBlock}) 
        GROUP BY to  
    )
    `
  return await getData(query)
}


/* ---------------------------------------------------------------------------------
                                        INCOMING
    --------------------------------------------------------------------------------
*/ 
export async function tx_get_incoming_connections(address_to)
/* 

_id
Txes
value
firstBlock
lastBlock

checking all incoming transactions to address_to that happened before the last outgoing transaction from address_to, 
grouping them by destination address, summing up transactions and values for each destination address */
{
  address_to = utils.toChecksumAddress(address_to)

    const query = `
    SELECT SUM(value) AS value, from AS _id, COUNT(from) AS Txes, MAX(timestamp) AS lastBlock 
    FROM ethereum.transaction_to 
    WHERE (to='${address_to}')
    GROUP BY from 
    ORDER BY SUM(value) AS value DESC 
    LIMIT 20
    `
 return await getData(query)
}

export async function tx_get_incoming_connections_before_blk(address_to, lastBlock) 
/* 

_id
Txes
value
firstBlock
lastBlock

checking all incoming transactions to address_to that happened before the last outgoing transaction from address_to, 
grouping them by destination address, summing up transactions and values for each destination address */
{
  address_to = utils.toChecksumAddress(address_to)

    const query = `
    SELECT SUM(value) AS value, from AS _id, COUNT(from) AS Txes, MAX(timestamp) AS lastBlock 
    FROM ethereum.transaction_to
    WHERE (to='${address_to}') AND (timestamp<=${lastBlock}) 
    GROUP BY from 
    ORDER BY SUM(value) AS value DESC 
    LIMIT 20
    `
 return await getData(query)
}

export async function tx_get_total_incoming_connections(address_to) 
/* 

_id
links
value

checking all incoming transactions to address_to that happened before the last outgoing transaction from address_to, 
grouping them by destination address and counting those unique addresses, summing up all the transactions */
{
  address_to = utils.toChecksumAddress(address_to)

    const query = `
    SELECT COUNT(from) as links, SUM(value) as value FROM 
    (
        SELECT SUM(value) AS value, from, COUNT(from) AS Txes 
        FROM ethereum.transaction_to
        WHERE (to='${address_to}')
        GROUP BY from  
    )
    `
    return await getData(query)

}

export async function tx_get_total_incoming_connections_before_blk(address_to, lastBlock) 
/* 

_id
links
value

checking all incoming transactions to address_to that happened before the last outgoing transaction from address_to, 
grouping them by destination address and counting those unique addresses, summing up all the transactions */
{
  address_to = utils.toChecksumAddress(address_to)

    const query = `
    SELECT COUNT(from) as links, SUM(value) as value FROM 
    (
        SELECT SUM(value) AS value, from, COUNT(from) AS Txes 
        FROM ethereum.transaction_to 
        WHERE (to='${address_to}') AND (timestamp<=${lastBlock}) 
        GROUP BY from  
    )
    `
  return await getData(query)

}


    
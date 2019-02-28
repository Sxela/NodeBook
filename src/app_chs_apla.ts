
let ClickHouse = require('@apla/clickhouse');

var ch = new ClickHouse ({host: 'data_chs', port: 8123});
//creating db and table if not existing


async function create_db_and_table()
{
    const query_db = `
    CREATE DATABASE IF NOT EXISTS ethereum;
    `
    const query_table_to = `
    
    CREATE TABLE IF NOT EXISTS ethereum.transaction_to_latest
    (
        from String, to String, value Float64, timestamp UInt64, txhash String
    ) 
        ENGINE = MergeTree()
        PRIMARY KEY to
        ORDER BY (to, timestamp, from, value)
    `

    const query_table_from = `

    CREATE TABLE IF NOT EXISTS ethereum.transaction_from_latest
    ENGINE = MergeTree() PRIMARY KEY from ORDER BY (from, timestamp, to, value) 
    AS SELECT * FROM ethereum.transaction_to_latest
    `

    ch.query(query_db, (err,res) => {
        if (err) console.log(err)
        else console.log('db created')
    })

    ch.query(query_table_to, (err,res) => {
        if (err) console.log(err)
        else console.log('table ethereum.transaction_to_latest created')
    })

    ch.query(query_table_from, (err,res) => {
        if (err) console.log(err)
        else console.log('table ethereum.transaction_from_latest created')
    })
}

// add data

export async function insert_data(data){
    
    const query_to = `
        INSERT INTO ethereum.transaction_to_latest (timestamp, from, to, value, txhash) 

    `
    const query_from = `
        INSERT INTO ethereum.transaction_from_latest (timestamp, from, to, value, txhash) 

    `
    //const stream = ch.query (query, {format: 'JSONEachRow'})
    const stream_to = ch.query (query_to, {format: 'TSV'})
    const stream_from = ch.query (query_from, {format: 'TSV'})

    data.forEach(elem=>{

        //stream.write (`{"from":"${elem.from}","to":"${elem.to}", "value":"${elem.value}", "txhash":"${elem.hash}", "timestamp":"${elem.blockNumber}"}`) // Do write as many times as possible
        stream_to.write ([elem.blockNumber, elem.from, elem.to, elem.value, elem.hash]) // Do write as many times as possible
        stream_from.write ([elem.blockNumber, elem.from, elem.to, elem.value, elem.hash])
        //stream.write(data);
    })
    
    await stream_to.end() // And don't forget to finish insert query
    await stream_from.end()
}  


export async function deduplicate(){

var query = `OPTIMIZE TABLE ethereum.transaction_to_latest FINAL DEDUPLICATE`;
ch.query(query, (err,res) => {
    if (err) console.log(err)
    else console.log('table optimized')
})
}

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
    //address_from = Web3.utils.toChecksumAddress(address_from)

    const query = `
    SELECT SUM(value) AS value, to AS _id, COUNT(to) AS Txes, MIN(timestamp) AS firstBlock
    FROM ethereum.transaction_from_latest 
    WHERE (from='${address_from}')
    GROUP BY to 
    ORDER BY SUM(value) AS value DESC 
    LIMIT 20
    `
   // console.log(await getData(query))
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
    const query = `
    SELECT SUM(value) AS value, to AS _id, COUNT(to) AS Txes, MIN(timestamp) AS firstBlock 
    FROM ethereum.transaction_from_latest 
    WHERE (from='${address_from}') AND (timestamp>=${firstBlock}) 
    GROUP BY to 
    ORDER BY SUM(value) AS value DESC 
    LIMIT 20
    `
  //  console.log(await getData(query))
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
    const query = `
    SELECT COUNT(to) as links, SUM(value) as value FROM 
    (
        SELECT SUM(value) AS value, to, COUNT(to) AS Txes 
        FROM ethereum.transaction_from_latest 
        WHERE (from='${address_from}')
        GROUP BY to  
    )
    `
 //   console.log(await getData(query))
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
    const query = `
    SELECT COUNT(to) as links, SUM(value) as value FROM 
    (
        SELECT SUM(value) AS value, to, COUNT(to) AS Txes 
        FROM ethereum.transaction_from_latest 
        WHERE (from='${address_from}') AND (timestamp>=${firstBlock}) 
        GROUP BY to  
    )
    `
  //  console.log(await getData(query))
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
    const query = `
    SELECT SUM(value) AS value, from AS _id, COUNT(from) AS Txes, MAX(timestamp) AS lastBlock 
    FROM ethereum.transaction_to_latest 
    WHERE (to='${address_to}')
    GROUP BY from 
    ORDER BY SUM(value) AS value DESC 
    LIMIT 20
    `
 //   console.log(await getData(query))
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
    const query = `
    SELECT SUM(value) AS value, from AS _id, COUNT(from) AS Txes, MAX(timestamp) AS lastBlock 
    FROM ethereum.transaction_to_latest 
    WHERE (to='${address_to}') AND (timestamp<=${lastBlock}) 
    GROUP BY from 
    ORDER BY SUM(value) AS value DESC 
    LIMIT 20
    `
 //   console.log(await getData(query))
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
    const query = `
    SELECT COUNT(from) as links, SUM(value) as value FROM 
    (
        SELECT SUM(value) AS value, from, COUNT(from) AS Txes 
        FROM ethereum.transaction_to_latest 
        WHERE (to='${address_to}')
        GROUP BY from  
    )
    `
    return await getData(query)
 //   console.log(await getData(query))

}

export async function tx_get_total_incoming_connections_before_blk(address_to, lastBlock) 
/* 

_id
links
value

checking all incoming transactions to address_to that happened before the last outgoing transaction from address_to, 
grouping them by destination address and counting those unique addresses, summing up all the transactions */
{
    const query = `
    SELECT COUNT(from) as links, SUM(value) as value FROM 
    (
        SELECT SUM(value) AS value, from, COUNT(from) AS Txes 
        FROM ethereum.transaction_to_latest 
        WHERE (to='${address_to}') AND (timestamp<=${lastBlock}) 
        GROUP BY from  
    )
    `
  //  console.log(await getData(query))
  return await getData(query)

}
/* ---------------------------------------------------------------------------------
                                        BLOCK FETCHER
    --------------------------------------------------------------------------------
*/ 


import Web3 = require("web3");
import config = require('./config/config');
let web3 = new Web3(new Web3.providers.HttpProvider(config.web3Provider));

export async function getBlock_direct(num:Number){
    if ((num % 100) == 0) {console.log('Fetching block number' + num)}
    const newblock = await web3.eth.getBlock(num,true, (err,res)=> {
            if (err) {
                console.log(err);
                setTimeout(block_worker, 60000)};
        })
    let txes = []    
    newblock.transactions.forEach(element => {
        let num : Number = element.value*1; 
        element.value = num;
        txes.push(element)
        })
    insert_data(txes);
}


export async function addBlocks_direct(startblock, endblock, callback = () => {}) //add blocks + transactions 
{
    let latestblock = await web3.eth.getBlockNumber();
    if (endblock > latestblock)
    { 
        console.log("Error: Block #" +  endblock + " doesn't exist yet! Replacing with current block: #"+ latestblock); 
        endblock =  latestblock;
    }
   for (let i=startblock;i<=endblock;i++) 
    {
        if (i % 100 == 0) console.log('checking block #'+i);
         await getBlock_direct(i);
    }
    callback();
    console.log('Done fetching.')
}


async function block_worker()
{
    const query = `
    SELECT MAX(timestamp) as latestblock
    FROM ethereum.transaction_to_latest
    `;

    var eth_latestblock = await web3.eth.getBlockNumber((err,res)=> {
        if (err) {
            console.log(err);
            setTimeout(block_worker, 60000)};
    });
    var db_latestblock = await getData(query);
    

    if ((eth_latestblock - db_latestblock[0].latestblock)>0) {
        console.log(`Latest block is ${eth_latestblock}, we're at ${db_latestblock[0].latestblock}. Fetching ${eth_latestblock - db_latestblock[0].latestblock} blocks`);
        addBlocks_direct(db_latestblock[0].latestblock,eth_latestblock, () => {setTimeout(block_worker, 60000)});
    } else {
        console.log(`Latest block is ${eth_latestblock}, we're good.`);
        setTimeout(block_worker, 60000);
    }
}

//deduplicate(); - is better run from the clickhouse-client, but you can still run it here each time you restart
create_db_and_table();
block_worker()




    
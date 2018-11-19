import * as express from 'express'
import Web3 = require("web3"); // Note the special syntax! Copy this line when in doubt!
// const web3 = new Web3("ws://localhost:8546");
let web3 = new Web3(new Web3.providers.HttpProvider("<your provider and api key>"));
web3.eth.getBlockNumber()
.then(console.log); 

//проверяем массив на дубликаты
function no_dupes(address, array): boolean
{
    return true;
}

// добавляем адрес в массив
function add_address(address, array)
{
    if(no_dupes(address,array))
    {
        array.push(address);
    }
}

  
//бэкап
const myFunc = async () => 
{
    try 
    {
        
        const cont =  web3.eth.getBlockTransactionCount(1728879);
        const blk = await web3.eth.getBlock(1728879,1);
        const tx =  blk.transactions;
        console.log(tx[1].from);
        return tx;
        

    } 
    catch (err) 
    {
        console.log(err);   
    }
}

//если найдет адрес, печатаем откуда и куда отправена транзакция
async function print(i, address)
{
    const count = await web3.eth.getBlockTransactionCount(i);
    const blk = await web3.eth.getBlock(i,1);
    const tx =  blk.transactions;
    if (i % 100 ==0) { console.log("block number "+i); } //чтобы не спамить, печатаем каждый 100й блок

    tx.forEach(item => {if (item.from == address || item.to == address) console.log("sent from " + item.from+" to " +item.to);})
    console.log("number of txes "+count);
    
}

// перебираем блоки в диапазоне и ищем указанный адрес в транзакциях
async function myFunc2(startblock, endblock, address) 
{
    console.log("looking for txes with address " + address);

    for (let i = startblock; i<endblock;i++)
    {
     await print(i, address);
    }
    console.log('done!');
}

myFunc2(1728879,1728879+10, 0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8)

// пока незачем, но пусть останется 
class App {
    public express

    constructor () {
        this.express = express()
        this.mountRoutes()
    }

    private mountRoutes(): void {
        const router = express.Router()
        router.get('/', (req, res) => {
            res.json({
                message: 'Hello World!'
                
            })
        })
        this.express.use('/', router)
    }
}

export default new App().express
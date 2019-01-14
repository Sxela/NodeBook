module.exports = {
    port: 8081,
    //mongoUrl: 'data:27017', //for docker mongo
    mongoUrl: 'docker.for.win.localhost:27017', //for localhost mongo
    mongoDatabase: 'test_block',
    mongoOptions: '{ useNewUrlParser: true }',
    web3Provider: "https://mainnet.infura.io/v3/25c667224edd406e857d23c6e4c07bc4"
}
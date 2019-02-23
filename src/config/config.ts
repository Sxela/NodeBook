module.exports = {
    port: 8081,
    mongoUrl: 'data:27017', //for docker mongo
    //mongoUrl: 'docker.for.win.localhost:27017', //for localhost mongo
    mongoDatabase: 'test_block',
    mongoOptions: { useNewUrlParser: true },
    web3Provider: "https://mainnet.infura.io/"
}

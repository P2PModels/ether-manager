const { Contract } = require('ethers')
const { ethers } = require('ethers')
const roundRobinAppAbi = require('../abis/RoundRobinApp.json')
const { 
    RINKEBY_ROUND_ROBIN_CONTRACT_ADDRESS, 
    RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY, 
    INFURA_PROJECT_ID 
} = require('./config-manager')


function getRRContract(signer) {
    const contractAddress = RINKEBY_ROUND_ROBIN_CONTRACT_ADDRESS
    return new Contract(contractAddress, roundRobinAppAbi, signer)
}

function setUpSigner(provider) {
    return new ethers.Wallet(RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY, provider)
}

function getAdHocSigner(network='rinkeby') {
    return setUpSigner(new ethers.providers.InfuraProvider(network, INFURA_PROJECT_ID))
}

function getSigner(network='rinkeby') {
    // Create a websocket to Ethereum
    const provider = ethers.providers.InfuraProvider.getWebSocketProvider(network, INFURA_PROJECT_ID)
    return setUpSigner(provider)
}

module.exports = { getRRContract, getSigner, getAdHocSigner }
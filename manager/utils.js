const { Contract } = require('ethers')
const { ethers } = require('ethers')
const roundRobinAppAbi = require('../abis/RoundRobinApp.json')
const { 
    REACT_APP_RINKEBY_ROUND_ROBIN_CONTRACT_ADDRESS, 
    REACT_APP_RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY, 
    REACT_APP_INFURA_PROJECT_ID 
} = require('./config-manager')


function getRRContract(signer) {
    const contractAddress = REACT_APP_RINKEBY_ROUND_ROBIN_CONTRACT_ADDRESS
    return new Contract(contractAddress, roundRobinAppAbi, signer)
}

function setUpSigner(provider) {
    return new ethers.Wallet(REACT_APP_RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY, provider)
}

function getAdHocSigner(network='rinkeby') {
    return setUpSigner(new ethers.providers.InfuraProvider(network, REACT_APP_INFURA_PROJECT_ID))
}

function getSigner(network='rinkeby') {
    // Create a websocket to Ethereum
    const provider = ethers.providers.InfuraProvider.getWebSocketProvider(network, REACT_APP_INFURA_PROJECT_ID)
    return setUpSigner(provider)
}

module.exports = { getRRContract, getSigner, getAdHocSigner }
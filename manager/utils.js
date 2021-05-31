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

function getSigner(network='rinkeby') {
    console.log(`INFURA_PROJECT_ID: ${INFURA_PROJECT_ID}`)
    const provider = ethers.providers.InfuraProvider.getWebSocketProvider(network, INFURA_PROJECT_ID)
    let signer

    console.log(`RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY: ${RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY}`)
    console.log(RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY)
    signer = new ethers.Wallet(RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY, provider)
  
    return signer
}

module.exports = { getRRContract, getSigner }
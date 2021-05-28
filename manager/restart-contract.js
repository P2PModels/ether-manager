const { getRRContract } = require('./utils')
const { getSigner } = require('../ethereum/ethers')


exports.restartContract = async () => {
    const signer = getSigner()

    console.log('Opening connection...')
    const contract = getRRContract(signer)
    
    console.log('Sending transaction...')
    const txResponse = await contract.restart()
    
    console.log('Awaiting response...')
    const txReceipt = await txResponse.wait()
    
    console.log(`Contract restarted on tx ${txReceipt.transactionHash}`)
    
    console.log('Closing connection...')
    signer.provider._websocket.terminate()
}
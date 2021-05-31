const { getSigner, getRRContract } = require('./utils')


exports.restartContract = async (existingSinger) => {
    let signer = undefined
    if (!existingSinger) {
        console.log('Opening connection...')
        signer = getSigner()
    } else {
        signer = existingSinger
    }
    const contract = getRRContract(signer)

    console.log('Sending transaction...')
    const txResponse = await contract.restart()
    
    console.log('Awaiting response...')
    const txReceipt = await txResponse.wait()
    
    console.log(`Contract restarted on tx ${txReceipt.transactionHash}`)
    
    if (!existingSinger) {
        console.log('Closing connection...')
        signer.provider._websocket.destroy()
    }
}
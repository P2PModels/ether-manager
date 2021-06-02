const { getAdHocSigner, getRRContract } = require('./utils')
const { generateMockData } = require('../ethereum/task-allocation-models/round-robin/mock-data-helpers')

exports.restartContract = async () => {
    console.log('Opening Ad-hoc Connection to Ethereum...')
    signer = getAdHocSigner()

    const contract = getRRContract(signer)

    console.log('Sending transaction...')
    const txResponse = await contract.restart()
    
    console.log('Awaiting response...')
    const txReceipt = await txResponse.wait()
    
    console.log(`Contract restarted on tx ${txReceipt.transactionHash}`)
    
    console.log('Loading mock data to the restarted contract...')
    await generateMockData(contract)

    console.log('Finished restarting contract...')
    return true
}
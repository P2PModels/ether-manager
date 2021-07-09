const { Contract } = require('ethers')
const {
  LOCAL_ROUND_ROBIN_CONTRACT_ADDRESS,
  RINKEBY_ROUND_ROBIN_CONTRACT_ADDRESS,
  RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY,
  DEFAULT_GAS,
  argv
} = require('../../../config')
const roundRobinAppAbi = require('../../../abis/RoundRobinApp.json')
const logger = require('../../../winston')

exports.usedEndDates = []

exports.getRRContract = signer => {
  const network = argv.network || 'local'
  let contractAddress

  if (network === 'rinkeby') {
    contractAddress = RINKEBY_ROUND_ROBIN_CONTRACT_ADDRESS
  }
  else {
    contractAddress = LOCAL_ROUND_ROBIN_CONTRACT_ADDRESS
  }

  return new Contract(contractAddress, roundRobinAppAbi, signer)
}

exports.sendTransaction = async (rrContract, method, args = []) => {
  const txResponse = await rrContract[method](...args)
  const txReceipt = await txResponse.wait()

  logger.info(`${method} called on tx ${txReceipt.transactionHash} `)

  return txReceipt
}

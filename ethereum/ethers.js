const ethers = require('ethers')
const {
  LOCAL_PROVIDER,
  RINKEBY_PROVIDER,
  RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY,
  LOCAL_SERVER_ACCOUNT_ADDRESS,
  INFURA_PROJECT_ID,
  argv
} = require('../config')

const network = argv.network || 'local'


exports.getSigner = () => {
  const provider = new ethers.providers.InfuraProvider.getWebSocketProvider(network, INFURA_PROJECT_ID)
  let signer

  if (network === 'rinkeby') {
    signer = new ethers.Wallet(RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY, provider)
  }

  return signer
}


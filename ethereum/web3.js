const Web3 = require('web3')
const {
  LOCAL_PROVIDER,
  RINKEBY_PROVIDER,
  RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY,
  LOCAL_SERVER_ACCOUNT_ADDRESS,
  argv
} = require('../config')
const logger = require('../winston')

const network = argv.network || 'local'

const options = {
  reconnect: {
    auto: true,
    delay: 1000,
    maxAttempts: 5,
    onTimeout: false
  }
}

function refreshProvider(web3, providerUrl) {
  let retries = 0

  function retry(event) {
    if (event) {
      logger.debug('Web3 provider disconnected or errored.')
      retries += 1

      if (retries > 5) {
        logger.debug(`Max retries of 5 exceeding: ${retries} times tried`)
        return setTimeout(refreshProvider, 5000)
      }
    } else {
      logger.debug(`Reconnecting web3 provider ${providerUrl}`)
      refreshProvider(web3, providerUrl)
    }

    return null
  }

  const provider = new Web3.providers.WebsocketProvider(providerUrl)
  
  provider.on('end', () => {
    logger.debug('Connection end event received')
    retry()
  })
  provider.on('error', () => {
    logger.debug('Connection error event received.')
    retry()
  })

  web3.setProvider(provider)

  logger.debug('New Web3 provider initiated')

  return provider
}

function setUpWeb3(network = 'local') {
  let web3
  if (network === 'rinkeby') {
    web3 = new Web3()
    refreshProvider(web3, RINKEBY_PROVIDER)
    const addedAccount = web3.eth.accounts.wallet.add(RINKEBY_SERVER_ACCOUNT_PRIVATE_KEY)
    web3.eth.defaultAccount = addedAccount.address
  }
  else if (network === 'local') {
    web3 = new Web3()
    refreshProvider(web3, LOCAL_PROVIDER)
    web3.eth.defaultAccount = LOCAL_SERVER_ACCOUNT_ADDRESS
  }

  return web3
}

const web3 = setUpWeb3(network)

exports.web3 = web3

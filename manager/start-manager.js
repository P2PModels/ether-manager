const { getRRContract, setUpEventListeners,  createJobsForAllocatedTasks} = require('./utils')
const { getSigner } = require('../ethereum/ethers')

const WAITING_TIME = 5000
const MAXIMUM_RETRIES = 5


exports.startManager = () => {
  const cronJobs = new Map()
  let retries = 0

  console.log('Executing events listener script...')

  function retry() {
    retries += 1

    if (retries > MAXIMUM_RETRIES) {
      console.log(`Maximum ${MAXIMUM_RETRIES} retries exceeded:  ${retries} times tried`)
      setTimeout(run, WAITING_TIME)
    } else {
      startManager()
    }

  }

  const signer = getSigner()

  signer.provider._websocket.on('close', () => retry())
  signer.provider._websocket.on('error', error => {
    console.log(`Connection error: ${error}`)
    retry()
  })

  const rrContract = getRRContract(signer)

  setUpEventListeners(cronJobs, rrContract)

  createJobsForAllocatedTasks(cronJobs, rrContract)

  return signer
}

const { getRRContract, getSigner } = require('./utils')
const { setUpEventListeners,  createJobsForAllocatedTasks} = require('./helpers')

const WAITING_TIME = 5000
const MAXIMUM_RETRIES = 5


async function startManager() {
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

  //signer.provider._websocket.onclose = () => retry()
  signer.provider._websocket.onerror = error => {
    console.log(`Connection error: ${error}`)
    retry()
  }

  const rrContract = getRRContract(signer)

  setUpEventListeners(cronJobs, rrContract)

  await createJobsForAllocatedTasks(cronJobs, rrContract)

  return {mgrSigner: signer, mgrCronJobs: cronJobs}
}

module.exports = { startManager }
const { CronJob, CronTime } = require('cron')
const { timestampToDate, timestampToHour, hexToAscii } = require('../../web3-utils')
const logger = require('../../../winston')
const { getWeb3 } = require('../../web3')
const { getRRContract, callContractMethod } = require('./round-robin')

const USER_REGISTERED = 'UserRegistered'
const USER_DELETED = 'UserDeleted'
const TASK_CREATED = 'TaskCreated'
const TASK_ALLOCATED = 'TaskAllocated'
const TASK_ACCEPTED = 'TaskAccepted'
const TASK_REJECTED = 'TaskRejected'
const TASK_DELETED = 'TaskDeleted'
const REJECTER_DELETED = 'RejecterDeleted'

const cronJobs = new Map()

function userRegisteredHandler(err, event = {}) {
  const { userId } = event.returnValues || {}

  if (err) {
    logger.error(`Error when receiving ${USER_REGISTERED} event - ${err}`)
  }
  else if (userId) {
    logger.info(`${USER_REGISTERED} event - User ${hexToAscii(userId)} created`)
  }
  else {
    logger.info(`${USER_REGISTERED} event - No params received`)
  }
}

function userDeletedHandler(err, event = {}) {
  const { userId } = event.returnValues || {}

  if (err) {
    logger.error(`Error when receiving ${USER_DELETED} event - ${err}`)
  }
  else if (userId){
    logger.info(`${USER_DELETED} event - User ${hexToAscii(userId)} deleted`)
  }
  else {
    logger.info(`${USER_DELETED} event - No params received`)
  }
}

function taskCreatedHandler(err, event = {}) {
  const { taskId } = event.returnValues || {}

  if (err) {
    logger.error(`Error when receiving ${TASK_CREATED} event - ${err}`)
  }
  else if (taskId) {
    logger.info(`${TASK_CREATED} event - Task ${hexToAscii(taskId)} created`)
  }
  else {
    logger.info(`${TASK_CREATED} event - No params received`)
  }
}

async function taskAllocatedHandler(err, event = {}) {
  const rrContract = getRRContract(web3)
  const { taskId, userId } = event.returnValues || {}
  if (err)  {
    logger.error(`Error when receiving ${TASK_ALLOCATED} event - ${err}`)
  }
  else if (taskId && userId) {
    const { endDate } = await rrContract.methods.getTask(taskId).call()

    logger.info(
      `${TASK_ALLOCATED} event - Task ${hexToAscii(taskId)} has been assigned to ${hexToAscii(userId)} and will be reassigned on ${timestampToHour(endDate)}`
    )

    let cronJob
    if (cronJobs.has(taskId)) {
      cronJob = cronJobs.get(taskId)
      cronJob.setTime(new CronTime(timestampToDate(endDate)))
    } else {
      cronJob = createReallocationCronJob(taskId, endDate)
      cronJobs.set(taskId, cronJob)
    }
    cronJob.start()
  }
  else {
    logger.info(
      `${TASK_ALLOCATED} event - No params received`
    )
  }
}

function taskRejectedHandler(err, event = {}) {
  const { taskId, userId } = event.returnValues || {}
  if (err) {
    logger.error(`Error when receiving ${TASK_REJECTED} event - ${err}`)
  }
  else if (taskId && userId) {
    logger.info(
      `${TASK_REJECTED} event - Task ${hexToAscii(taskId)} rejected by ${hexToAscii(userId)}`
    )
  }
  else {
    logger.info(`${TASK_REJECTED} event - No params received`)
  }
}

function taskAcceptedHandler(err, event = {}) {
  const { taskId, userId } = event.returnValues || {}
  if (err) logger.error(`Error when receiving ${TASK_ACCEPTED} event - ${err}`)
  else if (taskId, userId) {
    logger.info(`${TASK_ACCEPTED} event - Task ${hexToAscii(taskId)} accepted by user ${hexToAscii(userId)}`)
    if (cronJobs.has(taskId)) {
      cronJobs.get(taskId).stop()
    }
  }
  else {
    logger.info(`${TASK_ACCEPTED} event - No params received`)
  }
}

function taskDeletedHandler(err, event = {}) {
  const { taskId } = event.returnValues || {}
  if (err) {
    logger.error(`Error when receiving ${TASK_DELETED} event - ${err}`)
  }
  else if (taskId) {
    logger.info(`${TASK_DELETED} event - Task ${hexToAscii(taskId)} deleted`)
    if (cronJobs.has(taskId)) {
      cronJobs.get(taskId).stop()
    }
  }
  else {
    logger.info(`${TASK_DELETED} event - No params received`)
  }
}

function rejecterDeletedHandler(err, event = {}) {
  const { userId, taskId } = event.returnValues || {}
  
  if (err) {
    logger.error(`Error when receiving ${REJECTER_DELETED} event - ${err}`)
  }
  else {
    logger.info(`${REJECTER_DELETED} event - Task ${hexToAscii(taskId)} rejecter ${hexToAscii(userId)} deleted`)
  }
}

function createReallocationCronJob(taskId, timestamp) {
  const executionDate = timestampToDate(timestamp)

  return new CronJob(executionDate, function () {    
    // Wait a bit if provider is reconnecting to Infura node
    logger.info(`Executing job with task id: ${hexToAscii(taskId)} on ${executionDate}`)
    if (web3.currentProvider.reconnecting) {
      logger.info('Waiting a few seconds to reconnect before executing job')
      setTimeout(() => {
        reallocateTask(taskId)
      }, 1500)
    }
    else {
      reallocateTask(taskId)
    }
    
  })
}

function reallocateTask(taskId) {
  callContractMethod(web3, 'reallocateTask', [taskId]).then(
    () => {
      logger.info(`Job ${hexToAscii(taskId)} executed.`)
    },
    err => {
      logger.error(`Error trying to reallocate task ${taskId} - ${err}`)
    }
  )
}

function setUpEventListeners() {

  const rrContract = getRRContract(web3)

  rrContract.events[USER_REGISTERED]({}, userRegisteredHandler)
  rrContract.events[USER_DELETED]({}, userDeletedHandler)
  rrContract.events[TASK_CREATED]({}, taskCreatedHandler)
  rrContract.events[TASK_ALLOCATED]({}, taskAllocatedHandler)
  rrContract.events[TASK_ACCEPTED]({}, taskAcceptedHandler)
  rrContract.events[TASK_REJECTED]({}, taskRejectedHandler)
  rrContract.events[TASK_DELETED]({}, taskDeletedHandler)
  rrContract.events[REJECTER_DELETED]({}, rejecterDeletedHandler)

  logger.info('Round Robin Events Listener set up')
  
}

const onConnect = () => {
  logger.info('Handle CONNECT event')
  setUpEventListeners()

}

const onClose = () => {
  logger.info('Handle CLOSE event')

}

const onError = () => {
  logger.info('Handle ERROR event')
}

const web3 = getWeb3(onConnect, onClose, onError)

exports.start = () => {
  logger.info('Starting event listener script')
}

// setTimeout(() => {
//   console.log('closing connection')
//   web3.currentProvider.disconnect()
// }, 2000);
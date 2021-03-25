const { CronJob, CronTime } = require('cron')
const { timestampToDate, timestampToHour, hexToAscii } = require('../../web3-utils')
const logger = require('../../../winston')
const { tasks: mockTasks, INITIAL_TASKS } = require('./mock-data')
const { sendTransaction } = require('./round-robin')
const { ASSIGNED_NUM } = require('./task-statuses')
const { ethers } = require('ethers')

const USER_REGISTERED = 'UserRegistered'
const USER_DELETED = 'UserDeleted'
const TASK_CREATED = 'TaskCreated'
const TASK_ALLOCATED = 'TaskAllocated'
const TASK_ACCEPTED = 'TaskAccepted'
const TASK_REJECTED = 'TaskRejected'
const TASK_DELETED = 'TaskDeleted'
const REJECTER_DELETED = 'RejecterDeleted'

function userRegisteredHandler(userId) {
  if (userId) {
    logger.info(`${USER_REGISTERED} event - User ${hexToAscii(userId)} created`)
  }
  else {
    logger.info(`${USER_REGISTERED} event - No params received`)
  }
}

function userDeletedHandler(userId) {
  if (userId){
    logger.info(`${USER_DELETED} event - User ${hexToAscii(userId)} deleted`)
  }
  else {
    logger.info(`${USER_DELETED} event - No params received`)
  }
}

function taskCreatedHandler(taskId) {
  if (taskId) {
    logger.info(`${TASK_CREATED} event - Task ${hexToAscii(taskId)} created`)
  }
  else {
    logger.info(`${TASK_CREATED} event - No params received`)
  }
}

async function taskAllocatedHandler(cronJobs, rrContract, { userId, taskId }) {
  if (taskId && userId) {
    const { endDate } = await rrContract.getTask(taskId)
    const endDateNumber = endDate.toNumber()

    logger.info(
      `${TASK_ALLOCATED} event - Task ${hexToAscii(taskId)} has been assigned to ${hexToAscii(userId)} and will be reassigned on ${timestampToHour(endDateNumber)}`
    )

    let cronJob
    if (cronJobs.has(taskId)) {
      cronJob = cronJobs.get(taskId)
      cronJob.setTime(new CronTime(timestampToDate(endDateNumber)))
    } else {
      cronJob = createReallocationCronJob(rrContract, taskId, endDateNumber)
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

function taskRejectedHandler(cronJobs, rrContract, { userId, taskId }) {
  if (taskId && userId) {
    logger.info(
      `${TASK_REJECTED} event - Task ${hexToAscii(taskId)} rejected by ${hexToAscii(userId)}`
    )
    if (cronJobs.has(taskId)) {
      cronJobs.get(taskId).stop()
    }
    sendTransaction(rrContract, 'reallocateTask', [taskId])
  }
  else {
    logger.info(`${TASK_REJECTED} event - No params received`)
  }
}

function taskAcceptedHandler(cronJobs, { userId, taskId }) {
  if (taskId && userId) {
    logger.info(`${TASK_ACCEPTED} event - Task ${hexToAscii(taskId)} accepted by user ${hexToAscii(userId)}`)
    if (cronJobs.has(taskId)) {
      cronJobs.get(taskId).stop()
    }
  }
  else {
    logger.info(`${TASK_ACCEPTED} event - No params received`)
  }
}

function taskDeletedHandler(cronJobs, { taskId }) {
  if (taskId) {
    logger.info(`${TASK_DELETED} event - Task ${hexToAscii(taskId)} deleted`)
    if (cronJobs.has(taskId)) {
      cronJobs.get(taskId).stop()
    }
  }
  else {
    logger.info(`${TASK_DELETED} event - No params received`)
  }
}

function rejecterDeletedHandler(userId, taskId) {  
  logger.info(`${REJECTER_DELETED} event - Task ${hexToAscii(taskId)} rejecter ${hexToAscii(userId)} deleted`)
}

function createReallocationCronJob(rrContract, taskId, timestamp) {
  const executionDate = timestampToDate(timestamp)

  return new CronJob(executionDate, function () {
    sendTransaction(rrContract, 'reallocateTask', [taskId]).then(
      () => logger.info(`Job ${hexToAscii(taskId)} executed on ${executionDate}`)
    )
  })
}

exports.createJobsForMockTasks = async (cronJobs, rrContract) => {
  const tasksIds = mockTasks
    .map(({ job_id: taskId }) => taskId)
    .slice(0, INITIAL_TASKS)
    .map(tId => ethers.utils.formatBytes32String(tId))
  const tasks = await Promise.all(tasksIds.map(tId => rrContract.getTask(tId)))
  const allocatedTasks = tasks.filter(t => Number(t.status) === ASSIGNED_NUM)
  let cronJob

  logger.info(`Preparing existing tasks`)

  for (let i = 0; i < allocatedTasks.length; i++) {
    const { endDate: timestamp } = allocatedTasks[i]
    const now = new Date()
    const endDate = timestampToDate(timestamp.toNumber()) 
    const tId = tasksIds[i]
    if (endDate <= now) {
      await  sendTransaction(rrContract, 'reallocateTask', [tId])
    } else {
      logger.info('Creating job for existing task ' + hexToAscii(tId) + ' for ' + endDate)
      cronJob = createReallocationCronJob(rrContract, tId, timestamp.toNumber())
      cronJobs.set(tId, cronJob)
    }
  }
}

exports.setUpEventListeners = async (cronJobs, rrContract) => {
  rrContract.on(USER_REGISTERED, userRegisteredHandler)
  rrContract.on(USER_DELETED, userDeletedHandler)
  rrContract.on(TASK_CREATED, taskCreatedHandler)
  rrContract.on(TASK_ALLOCATED, (userId, taskId) => taskAllocatedHandler(cronJobs, rrContract, { userId, taskId }))
  rrContract.on(TASK_ACCEPTED, (userId, taskId) => taskAcceptedHandler(cronJobs, { userId, taskId }))
  rrContract.on(TASK_REJECTED, (userId, taskId) => taskRejectedHandler(cronJobs, rrContract, { userId, taskId }))
  rrContract.on(TASK_DELETED, taskId => taskDeletedHandler(cronJobs, { taskId }))
  rrContract.on(REJECTER_DELETED, rejecterDeletedHandler)

  logger.info('Events listeners set up')
}

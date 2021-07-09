const { CronJob, CronTime } = require('cron')
const { timestampToDate, timestampToHour, hexToAscii } = require('../../web3-utils')
const logger = require('../../../winston')
const { tasks: mockTasks, INITIAL_TASKS } = require('./mock-data')
const { sendTransaction, usedEndDates } = require('./round-robin')
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
    // endDate indicates when the task should be reallocated
    const { endDate } = await rrContract.getTask(taskId)
    var endDateNumber = endDate.toNumber()

    logger.info(
      `${TASK_ALLOCATED} event - Task ${hexToAscii(taskId)} has been assigned to ${hexToAscii(userId)} and will be reassigned on ${timestampToHour(endDateNumber)}`
    )

    let cronJob
    // Check if there is already a cron job for the taskId
    if (cronJobs.has(taskId)) {
      // If there is already a cron job for the taskId,
      // the cronjob is obtained and set a new time considering
      // its endDate

      cronJob = cronJobs.get(taskId)

      while (usedEndDates.some(endDates => endDates == endDateNumber)) {
        endDateNumber = endDateNumber + 60
        logger.info(
          `A cronjob already exist with the assigned hour. Reassigning again to ${timestampToHour(endDateNumber)}`)
      }

      cronJob.setTime(new CronTime(timestampToDate(endDateNumber)))
      usedEndDates.push(endDateNumber)

    } else {
      // If the task is being assigned for the first time, a cron job 
      // is created and saved into cronJobs
      cronJob = createReallocationCronJob(rrContract, taskId, endDateNumber)
      cronJobs.set(taskId, cronJob)
      usedEndDates.push(endDateNumber)
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
      // Whenever a rejected task event is received the cronjob is stopped
      cronJobs.get(taskId).stop()
    }
    // The rejected task indicated by taskId is reassigned
    sendTransaction(rrContract, 'reallocateTask', [taskId])
  }
  else {
    // This else was implemented to control for situations in which 
    // the task rejected task event is emitted without parameters
    logger.info(`${TASK_REJECTED} event - No params received`)
  }
}

function taskAcceptedHandler(cronJobs, { userId, taskId }) {
  if (taskId && userId) {
    logger.info(`${TASK_ACCEPTED} event - Task ${hexToAscii(taskId)} accepted by user ${hexToAscii(userId)}`)
    if (cronJobs.has(taskId)) {
      // Whenever an accepted task event is received the corresponding cronjob
      // is stopped
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
      // Whenever a deleted task event is received the corresponding cronjob
      // is stopped
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

  // reallocateTask is called when executionDate arrives
  return new CronJob(executionDate, function () {
    sendTransaction(rrContract, 'reallocateTask', [taskId]).then(
      () => logger.info(`Job ${hexToAscii(taskId)} executed on ${Date().toString()}`)
    )
  })
}

/**
 * Function implemented to create cronjobs for tasks that were
 * already allocated. The primary use case is for situations when 
 * the ether manager stops and there tasks already allocated. These 
 * already allocated tasks exist in the contract but their cronjobs 
 * are lost. So, new cronjobs need to be created for these tasks.
 */


exports.createJobsForAllocatedTasks = async (cronJobs, rrContract) => {

  // Get task ids
  const tasksIds = mockTasks
    .map(({ job_id: taskId }) => taskId)
    .slice(0, INITIAL_TASKS)
    .map(tId => ethers.utils.formatBytes32String(tId))
  
  // Get tasks from the contract given taskIds
  // Promise.all receives an array of promises and return an error
  // if some of the given promises fail. If no error occurr, meaning,
  // for this case, all tasks exist in the contract.
  const tasks = await Promise.all(tasksIds.map(tId => rrContract.getTask(tId)))

  // Select only those tasks that were assigned. Tasks that were accepted,
  // rejected, or completed are filtered out. 
  const allocatedTasks = tasks.filter(t => Number(t.status) === ASSIGNED_NUM)

  let cronJob

  logger.info(`Preparing existing and assigned tasks`)

  for (let i = 0; i < allocatedTasks.length; i++) {
    // endDate is the time when the task should have been
    // reasigned
    const { endDate: timestamp } = allocatedTasks[i]
    const now = new Date()
    const endDate = timestampToDate(timestamp.toNumber()) 
    const tId = tasksIds[i]
    
    // If the task's end date has already passed, task should be reallocated
    if (endDate <= now) {
      logger.info('End date for task ' + hexToAscii(tId) + ' has already passed, the task is going to be reallocated')
      await  sendTransaction(rrContract, 'reallocateTask', [tId])
    } else {
      // If the task's end date hasn't already passed, the task is still valid
      // so the cronjob is created
      logger.info('Creating cronjob for existing task ' + hexToAscii(tId) + ' for ' + endDate)

      cronJob = createReallocationCronJob(rrContract, tId, timestamp.toNumber())
      cronJobs.set(tId, cronJob)
      usedEndDates.push(timestamp.toNumber)
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

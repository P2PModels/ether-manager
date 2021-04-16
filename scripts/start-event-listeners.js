#!/usr/bin/env node
const { setUpEventListeners, createJobsForAllocatedTasks } = require('../ethereum/task-allocation-models/round-robin/event-listener-helpers')
const { getSigner } = require('../ethereum/ethers')
const { getRRContract } = require('../ethereum/task-allocation-models/round-robin/round-robin')
const logger = require('../winston')

const WAITING_TIME = 5000
const MAXIMUM_RETRIES = 5

function start() {
  const cronJobs = new Map()
  let retries = 0

  logger.info('Executing events listener script...')

  function retry() {
    retries += 1

    if (retries > MAXIMUM_RETRIES) {
      logger.info(`Maximum ${MAXIMUM_RETRIES} retries exceeded:  ${retries} times tried`)
      setTimeout(run, WAITING_TIME)
    } else {
      start()
    }

  }

  const signer = getSigner()

  signer.provider._websocket.on('close', () => retry())
  signer.provider._websocket.on('error', error => {
    logger.error(`Connection error: ${error}`)
    retry()
  })

  const rrContract = getRRContract(signer)

  setUpEventListeners(cronJobs, rrContract)

  createJobsForAllocatedTasks(cronJobs, rrContract)
}

start()
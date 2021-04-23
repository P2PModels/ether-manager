#!/usr/bin/env node

const { ethers } = require('ethers')
const { getRRContract } = require('../ethereum/task-allocation-models/round-robin/round-robin')
const { getSigner } = require('../ethereum/ethers')
const logger = require('../winston')
const { tasks: mockTasks, INITIAL_TASKS } = require('../ethereum/task-allocation-models/round-robin/mock-data')
const { ASSIGNED_NUM, ACCEPTED_NUM, REJECTED_NUM } = require('../ethereum/task-allocation-models/round-robin/task-statuses')
const { timestampToDate, hexToAscii } = require('../ethereum/web3-utils')


getContractStatus = async () => {
    logger.info('Opening connection to Ethereum...')
    const signer = getSigner()
    
    logger.info('Getting contract "handler"')
    const rrContract = getRRContract(signer)

    // Process task ids
    logger.info('Processing task ids')
    const taskIds = mockTasks
        .map(({ job_id: taskId }) => taskId)
        .slice(0, INITIAL_TASKS)
        .map(tId => ethers.utils.formatBytes32String(tId))

    // Get tasks from the contract given taskIds
    logger.info('Getting tasks from contract...')
    const tasks = await Promise.all(taskIds.map(tId => rrContract.getTask(tId)))

    logger.info(`----- Status of Tasks ---------`)
    for (let i = 0; i < tasks.length; i++) {
        const { assignee, status, endDate: timestamp } = tasks[i]
        logger.info(`Task [${i+1}]: ${hexToAscii(taskIds[i])}`)
        switch(status) {
            case ACCEPTED_NUM:
                logger.info('Status: ACCEPTED')
                logger.info(`User: ${hexToAscii(assignee)}`)
                break
            case REJECTED_NUM:
                logger.info('Status: REJECTED (by all users)')
                break
            case ASSIGNED_NUM:
                const endDate = timestampToDate(timestamp.toNumber())
                logger.info('Status: ASIGNED')
                logger.info(`User: ${hexToAscii(assignee)}`)
                logger.info(`Reasigned by: ${endDate}`)
                break
            default:
                logger.error(`Unknown status ${status}`)
        }
        logger.info('---------')
    }

    logger.info('Closing connection...')
    signer.provider._websocket.terminate()
}

getContractStatus()
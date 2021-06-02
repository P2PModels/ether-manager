const { ethers } = require('ethers')
const { getAdHocSigner, getRRContract } = require('./utils')
const { tasks: mockTasks, INITIAL_TASKS } = require('../ethereum/task-allocation-models/round-robin/mock-data')
const { ASSIGNED_NUM, ACCEPTED_NUM, REJECTED_NUM } = require('../ethereum/task-allocation-models/round-robin/task-statuses')
const { timestampToDate, hexToAscii } = require('../ethereum/web3-utils')


exports.processTasksInfo = async () => {
    let signer = undefined
    
    console.log('Opening ad-hoc connection to Ethereum...')
    signer = getAdHocSigner()
    
    console.log('Getting contract "handler"')
    const rrContract = getRRContract(signer)

    // Process task ids
    console.log('Processing task ids')
    const taskIds = mockTasks
        .map(({ job_id: taskId }) => taskId)
        .slice(0, INITIAL_TASKS)
        .map(tId => ethers.utils.formatBytes32String(tId))

    // Get tasks from the contract given taskIds
    console.log('Getting tasks from contract...')
    const tasks = await Promise.all(taskIds.map(tId => rrContract.getTask(tId)))

    let taskObjs = []
    for (let i = 0; i < tasks.length; i++) {
        const { assignee, status, endDate: timestamp } = tasks[i]
        let taskObj = {
            'id': hexToAscii(taskIds[i]),
            'user': hexToAscii(assignee),
            'reassignedBy': timestampToDate(timestamp.toNumber())
        }
        switch(status) {
            case ACCEPTED_NUM:
                taskObj['status'] = 'Accepted'
                break
            case REJECTED_NUM:
                taskObj['status'] = 'Rejected'
                break
            case ASSIGNED_NUM:
                taskObj['status'] = 'Assigned'
                break
            default:
                logger.error(`Unknown status ${status}`)
        }
        taskObjs.push(taskObj)
    }

    return JSON.stringify(taskObjs)
}

const { ethers } = require('ethers')
const { getSigner, getRRContract } = require('./utils')
const { tasks: mockTasks, INITIAL_TASKS } = require('../ethereum/task-allocation-models/round-robin/mock-data')
const { ASSIGNED_NUM } = require('../ethereum/task-allocation-models/round-robin/task-statuses')


exports.reallocateTasks = async (existingSigner) => {
    let signer = undefined
    if (!existingSinger) {
        console.log('Opening connection to Ethereum...')
        signer = getSigner()
    } else {
        signer = existingSigner
    }
    
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

    // Select only tasks that were assigned. Tasks that were accepted,
    // rejected, or completed are filtered out. 
    const allocatedTasks = tasks.filter(t => Number(t.status) === ASSIGNED_NUM)

    console.log(`Going to reallocate ${allocatedTasks.length} tasks`)
    for (let i = 0; i < allocatedTasks.length; i++) {
        const tId = taskIds[i]
        console.log(`Reallocating task: ${tId}`)
        await  sendTransaction(rrContract, 'reallocateTask', [tId])
    }

    console.log('Tasks have been reallocated')

    if (!existingSinger) {
        console.log('Closing connection...')
        signer.provider._websocket.destroy()
    }
}

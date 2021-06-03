const { startManager: start } = require("./manager/start-manager")
const {restartContract: restart } = require('./manager/restart-contract')
const { processTasksInfo } = require('./manager/get-tasks-info')
const { reallocateTasks: reallocate } = require('./manager/reallocate-tasks')
const { stopManager: stop } = require("./manager/stop-manager")


exports.startManager = async () => { 
    console.log('Stating manager...')
    return await start()
}

exports.stopManager = (signer, cronJobs) => {
    console.log('Stopping manager...')
    stop(signer, cronJobs)
}

exports.restartContract = () => {
    console.log('Restarting contract...')
    return restart()
}

exports.getContractStatus = () => {
    console.log('Getting contract status...')
    return processTasksInfo()
}

exports.reallocateTasks = () => {
    console.log('Reallocating tasks...')
    return reallocate()
}

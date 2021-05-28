const {startManager: start} = require("./manager/start-manager")
const {restartContract: restart } = require('./manager/restart-contract')
const processTasksInfo = require('./manager/get-tasks-info')
const {reallocateTasks: reallocate} = require('./manager/reallocate-tasks')


exports.startManager = () => {
    console.log('Starting manager...')
    const signer = start()
    return signer
}

exports.stopManager = (signer) => {
    console.log('Stopping manager...')
    console.log(signer)
    signer.provider._websocket.terminate()
}

exports.restartContract = () => {
    console.log('Restarting contract...')
    //restart()
}

exports.getContractStatus = () => {
    console.log('Getting contract status...')
    //const tasks = processTasksInfo()
    //return tasks
}

exports.reallocateTasks = () => {
    console.log('Reallocating tasks...')
    //reallocate()
}

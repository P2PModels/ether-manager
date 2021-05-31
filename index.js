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
    signer.provider.destroy()
}

exports.restartContract = (signer=undefined) => {
    console.log('Restarting contract...')
    restart(signer)
}

exports.getContractStatus = (signer=undefined) => {
    console.log('Getting contract status...')
    const tasks = processTasksInfo(signer)
    return tasks
}

exports.reallocateTasks = (signer=undefined) => {
    console.log('Reallocating tasks...')
    reallocate(signer)
}

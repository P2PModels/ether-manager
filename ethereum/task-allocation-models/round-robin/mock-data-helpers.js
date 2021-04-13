const { formatBytes32String } = require('ethers/lib/utils')
const { timestampToHour, hexToAscii } = require('../../web3-utils')
const { DEFAULT_GAS } = require('../../../config')
const { getSigner } = require('../../ethers')
const { users, tasks, reallocationTimes, INITIAL_TASKS } = require('./mock-data')
const { getRRContract } = require('./round-robin')

const signer = getSigner()
const contract = getRRContract(signer)
const options = { gasLimit: 850000, /* gasPrice: 20000000000 */ }

async function getInitialTasksIds(tasks, maxTasks = 1) {
  const tasksIds = tasks.map(({ job_id: taskId }) => taskId)
  return tasksIds.slice(0, maxTasks)
}

async function registerMockUserAccounts(userAccounts) {
  const createdAccounts = []
  for (let i = 0; i < userAccounts.length; i++) {
    try {
      const hexUser = formatBytes32String(userAccounts[i])
      const txResponse = await contract.registerUser(hexUser, options)
      const txReceipt = await txResponse.wait()
      createdAccounts.push(userAccounts[i])
      console.log(`User ${userAccounts[i]} created on tx ${txReceipt.transactionHash}`)
    } catch (err) {
      console.error(`Error when creating ${userAccounts[i]}`)
      console.error(err)
    }
  }
  return createdAccounts
}

async function createMockTasks(tasks) {
  const createdTasks = []
  for (let i = 0; i < tasks.length; i++) {
    try {
      const hexId = formatBytes32String(tasks[i])
      const reallocationTime = reallocationTimes[i]
      const txResponse = await contract.createTask(hexId, reallocationTime, options)
      const txReceipt = await txResponse.wait()

      createdTasks.push(tasks[i])
      console.log(`Task ${tasks[i]} created on tx ${txReceipt.transactionHash}`)
    } catch (err) {
      console.error(`Error when creating task ${tasks[id]}`)
      console.error(err)
    }
  }

  return createdTasks
}

async function allocateMockTasks(tasks, userAccounts) {
  const userTaskRegistry = userAccounts.reduce((reg, currUser) => {
    reg[currUser] = 0
    return reg
  }, {})
  const maxAllocatedTasks = await contract.MAX_ALLOCATED_TASKS()

  for (let i = 0; i < tasks.length; i++) {
    let randomUser = getRandomElement(userAccounts)
    while (userTaskRegistry[randomUser] >= maxAllocatedTasks) {
      randomUser = getRandomElement(userAccounts)
    }
    userTaskRegistry[randomUser]++
    const hexId = formatBytes32String(tasks[i])
    const hexUser = formatBytes32String(randomUser)

    const txResponse = await contract.allocateTask(hexId, hexUser, options)
    const txReceipt = await txResponse.wait()
    console.log(`Task ${tasks[i]} assigned to user ${randomUser} on tx ${txReceipt.transactionHash}`)
  }
}

function getRandomElement(elements) {
  return elements[Math.floor(Math.random() * elements.length)]
}

async function getTasks(tasksIds) {
  const tasks = await Promise.all(tasksIds.map(tId => contract.getTask(tId)))
  console.log(tasks)
}

exports.restartContract = async () => {
  console.log('Restarting contract...')

  const txResponse = await contract.restart()
  const txReceipt = await txResponse.wait()

  console.log(`Contract restarted on tx ${txReceipt.transactionHash}`)
}

exports.generateMockData = async () => {
  const tasksIds = await getInitialTasksIds(tasks, INITIAL_TASKS)

  // Register amara users
  // const createdAccounts = await registerMockUserAccounts(users)
  // console.log(createdAccounts)
  // Create and allocate tasks
  // const createdTaskIds = await createMockTasks(tasksIds)
  // allocateMockTasks([tasksIds[1], tasksIds[2]], createdAccounts)
  await allocateMockTasks(tasksIds, users)

  // restartContract()
}

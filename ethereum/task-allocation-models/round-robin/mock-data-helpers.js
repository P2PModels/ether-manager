const { formatBytes32String } = require('ethers/lib/utils')
const { timestampToHour, hexToAscii } = require('../../web3-utils')
const { DEFAULT_GAS } = require('../../../config')
const { getSigner } = require('../../ethers')
const { users, tasks, reallocationTimes, INITIAL_TASKS } = require('./mock-data')
const { getRRContract } = require('./round-robin')

const signer = getSigner()
const contract = getRRContract(signer)
// The gas limit (in wei) was inspired by the hive.one project. It is 
// sufficiently high to avoid delays and the same time sufficiently 
// low to avoid expensive transactions
const options = { gasLimit: 850000, /* gasPrice: 20000000000 */ }

async function getInitialTasksIds(tasks, maxTasks = 1) {
  const tasksIds = tasks.map(({ job_id: taskId }) => taskId)
  return tasksIds.slice(0, maxTasks)
}

/**
 * Register users in the contract
*/
async function registerMockUserAccounts(userAccounts) {
  const createdAccounts = []
  for (let i = 0; i < userAccounts.length; i++) {
    try {
      // Transform usernames given in strings to byte32, 
      // which is the type used in the contract
      const hexUser = formatBytes32String(userAccounts[i])
      // Call the contract's method to register the user
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

/**
 * Allocate mock tasks
 */
async function allocateMockTasks(tasks, userAccounts) {
  const userTaskRegistry = userAccounts.reduce((reg, currUser) => {
    reg[currUser] = 0
    return reg
  }, {})
  
  // Get how many tasks a user can have allocated at time, 3 by default
  const maxAllocatedTasks = await contract.MAX_ALLOCATED_TASKS()

  for (let i = 0; i < tasks.length; i++) {
    // Get a random index of the user array
    let randomUser = getRandomElement(userAccounts)
    
    // Check if the randomly selected user has already allocated the maximum
    // number of tasks (3 by default). If this is the case, enter into a loop that
    // search for user that doesn't have already allocated the maximum number
    // of tasks (3).
    while (userTaskRegistry[randomUser] >= maxAllocatedTasks) {
      randomUser = getRandomElement(userAccounts)
    }

    // Increment the counter of allocated tasks of the randomly selected user
    userTaskRegistry[randomUser]++
    const hexId = formatBytes32String(tasks[i])
    const hexUser = formatBytes32String(randomUser)
    
    console.log(`Sending transaction to allocate task ${tasks[i]} to user ${randomUser}...`)
    // The contract method allocateTask is only used here. No other 
    // method call it
    const txResponse = await contract.allocateTask(hexId, hexUser, options)

    console.log('Awaiting response...')
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
  const createdAccounts = await registerMockUserAccounts(users)
  
  // Create tasks
  const createdTaskIds = await createMockTasks(tasksIds)
  
  // Allocate tasks
  await allocateMockTasks(tasksIds, users)
}

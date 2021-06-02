const { exec } = require('child_process')
const { generateMockData } = require('./mock-data-helpers')
const roundRobin = require('../round-robin/round-robin')
const { getSigner } = require('../../ethers')
const { getRRContract } = require('./round-robin')

const signer = getSigner()
const contract = getRRContract(signer)


exports.startRoundRobin = (mockData = false) => {
  exec(
    'node ./ethereum/task-allocation-models/round-robin/events-listener.js',
    (err, stdout, stderr) => {
      if (err) {
        console.error(err)
        return
      }
      console.log('Run event listeners: ')
      console.log(stdout)
      if (mockData) generateMockData(contract)
    }
  )
}

exports.roundRobin = roundRobin

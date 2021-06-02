#!/usr/bin/env node
const { generateMockData } = require('../ethereum/task-allocation-models/round-robin/mock-data-helpers')
const { getSigner } = require('../ethereum/ethers')
const { getRRContract } = require('../ethereum/task-allocation-models/round-robin/round-robin')

const signer = getSigner()
const contract = getRRContract(signer)

generateMockData(contract)
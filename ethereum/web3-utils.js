const { toHex, hexToAscii } = require('web3-utils')

const timestampToHour = timestamp => {
  // Create a new JavaScript Date object based on the timestamp
  const date = new Date(timestamp * 1000)
  // Hours part from the timestamp
  const hours = date.getHours()
  // Minutes part from the timestamp
  const minutes = '0' + date.getMinutes()
  // Seconds part from the timestamp
  const seconds = '0' + date.getSeconds()

  // Will display time in HH:MM:SS format
  const formattedTime =
    hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2)

  return formattedTime
}

const timestampToDate = timestamp => new Date(timestamp * 1000)

module.exports = { toHex, hexToAscii, timestampToHour, timestampToDate }

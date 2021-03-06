const { toHex, hexToAscii } = require('web3-utils')

// Every byte consists of two hex values hence 32 * 2 = 64. And 0x + 64 = 66 values
const toBytes32 = (text, totalLength = 66) => {
  const hexText = toHex(text)
  const paddingSize = totalLength - hexText.length

  if (paddingSize <= 0) return hexText

  return hexText + Array(paddingSize).fill(0).join('')
}

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

module.exports = { toHex, hexToAscii, toBytes32, timestampToHour, timestampToDate }

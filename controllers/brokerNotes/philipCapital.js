const _ = require('lodash')

module.exports.pcBrokerNote = (data) => {
  let resData = {}
  let indexBroker = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'CONTRACT NOTE CUM BILL'
  })
  let indexDate = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Trade Date'
  })
  let indexCnnum = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Contract Note No.'
  })

  resData.date = data[indexDate + 1].str.trim()
  resData.broker = data[indexBroker + 1].str.trim()
  resData.cnnum = data[indexCnnum + 1].str.trim()

  let startIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'TOTAL (NET)'
  })

  resData.stt = Number(data[startIndex + 4].str.trim())
  resData.stamp = Number(data[startIndex + 12].str.trim())
  resData.other = Number(data[startIndex + 10].str.trim())
  resData.trans = Number(data[startIndex + 8].str.trim())
  resData.gst = Number(data[startIndex + 6].str.trim())
  resData.total = Math.abs(Number(data[startIndex + 14].str.trim()))

  let setIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Remarks'
  })

  let y = data[setIndex + 1].y
  let assetsArray = []

  while (true) {
    let selectedData = _.filter(data, function (obj) {
      if (obj.y == y) {
        return obj
      }
    })
    if (selectedData.length < 1 || selectedData[0].str.trim() == 'TOTAL (NET)') {
      break
    } else if (selectedData[0].str.trim() != 'Net Total') {
      singleObj = {}
      singleObj.name = selectedData[4].str.trim()
      singleObj.date = data[indexDate + 1].str.trim()
      singleObj.transaction = selectedData[5].str.trim() == 'S' ? 'Sell' : 'Buy'
      singleObj.quantity = selectedData[6].str.trim()
      singleObj.price = selectedData[9].str.trim()
      singleObj.brokerage = selectedData[8].str.trim()
      singleObj.amount = Math.abs(Number(selectedData[11].str.trim()))
      assetsArray.push(singleObj)
    }

    let lastIndex = selectedData.length - 1
    let newIndex = _.findIndex(data, function (obj) {
      return (obj.x == selectedData[lastIndex].x && obj.y == selectedData[lastIndex].y)
    })

    y = data[newIndex + 1].y
    y = Number(y)
  }
  resData.assetsArray = assetsArray
  return resData
}
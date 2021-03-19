const _ = require('lodash')

module.exports.kvBrokerNote = (data) => {
  let resData = {}
  let indexBroker = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'CONTRACT NOTE CUM TAX INVOICE'
  })
  let indexDate = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'TRADE DATE'
  })
  let indexCnnum = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'CONTRACT NOTE NO.'
  })

  resData.date = data[indexDate + 1].str.trim()
  resData.broker = data[indexBroker + 3].str.trim()
  resData.cnnum = data[indexCnnum + 1].str.trim()

  let startIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'TOTAL (Net)'
  })

  resData.stt = Number(data[startIndex + 9].str.trim())
  resData.stamp = data[startIndex + 27].str.trim()
  let otherCharges = Number(data[startIndex + 21].str.trim()) + Number(data[startIndex + 24].str.trim())
  resData.other = otherCharges
  resData.trans = data[startIndex + 18].str.trim()
  let gstCharges = Math.abs(Number(data[startIndex + 12].str.trim()) + Number(data[startIndex + 15].str.trim()))
  resData.gst = gstCharges
  resData.total = Math.abs(Number(data[startIndex + 30].str.trim()))

  let setIndex = _.findIndex(data, function (obj) {
    return obj.str.trim().includes('NSE - CAPITAL - Normal')
  })

  let y = data[setIndex + 1].y
  let assetsArray = []

  while (true) {
    let selectedData = _.filter(data, function (obj) {
      if (obj.y == y) {
        return obj
      }
    })
    if (selectedData.length < 1 || selectedData[0].str.trim() == 'NSE CAPITAL') {
      break
    } else if (selectedData[0].str.trim() != 'Net Total') {
      singleObj = {}
      singleObj.name = selectedData[4].str.trim()
      singleObj.date = data[indexDate + 1].str.trim()
      singleObj.transaction = selectedData[5].str.trim() == 'S' ? 'Sell' : 'Buy'
      singleObj.quantity = selectedData[6].str.trim()
      singleObj.price = selectedData[9].str.trim()
      singleObj.brokerage = selectedData[8].str.trim()
      singleObj.amount = selectedData[10].str.trim()
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
  return resData;
}
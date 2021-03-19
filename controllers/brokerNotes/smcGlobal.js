const _ = require('lodash')

module.exports.sgBrokerNote = (data) => {
  let resData = {}
  let indexBroker = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'CONTRACT NOTE CUM TAX INVOICE'
  })
  let indexDate = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Trade Date'
  })
  let indexCnnum = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Contract Note No.'
  })
  let sstIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'STT'
  })
  let brokerageIndex = _.findLastIndex(data, function (obj) {
    return obj.str.trim() == 'Brokerage'
  })
  let transIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Transaction Charges'
  })
  let stampIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Stamp Duty'
  })
  let otherIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Taxable value of supply'
  })
  let gstIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'CGST@9%'
  })
  let amountIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Net amount'
  })

  resData.date = data[indexDate + 1].str.trim()
  resData.cnnum = data[indexCnnum + 1].str.trim()
  resData.broker = data[indexBroker + 2].str.trim()

  let initialRow = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'MTF'
  })

  let x = 13.9
  let y = data[initialRow + 2].y
  let assetsArray = []
  while (true) {
    let rowIndex = _.findIndex(data, function (obj) {
      return (obj.x == 13.9 && obj.y == y)
    })
    let nextObj10 = _.find(data, function (obj) {
      return (obj.x == x && obj.y == y + 10)
    })
    let nextObj16 = _.find(data, function (obj) {
      return (obj.x == x && obj.y == y + 16)
    })
    let nextObj20 = _.find(data, function (obj) {
      return (obj.x == x && obj.y == y + 20)
    })
    let nextObj26 = _.find(data, function (obj) {
      return (obj.x == x && obj.y == y + 26)
    })

    let name = data[rowIndex + 4].str.trim()
    rowIndex = data[rowIndex + 4].x == data[rowIndex + 5].x ? rowIndex + 1 : rowIndex


    singleObj = {}
    singleObj.name = name
    singleObj.date = data[indexDate + 1].str.trim()
    singleObj.transaction = data[rowIndex + 5].str.trim()
    singleObj.quantity = data[rowIndex + 6].str.trim()
    singleObj.price = data[rowIndex + 8].str.trim()
    singleObj.brokerage = data[rowIndex + 9].str.trim()
    singleObj.amount = Math.abs(Number(data[rowIndex + 11].str.trim()))
    assetsArray.push(singleObj)
    if (nextObj10 != undefined && nextObj10.str.trim() != 'Description') {
      y = y + 10
    } else if (nextObj16 != undefined && nextObj16.str.trim() != 'Description') {
      y = y + 16
    } else if (nextObj20 != undefined && nextObj20.str.trim() != 'Description') {
      y = y + 20
    } else if (nextObj26 != undefined && nextObj26.str.trim() != 'Description') {
      y = y + 26
    } else {
      break
    }
  }
  resData.stt = data[sstIndex + 2].str.trim()
  resData.stamp = data[stampIndex + 2].str.trim()
  let otherCharges = Number(data[brokerageIndex + 2].str.trim()) + Number(data[otherIndex + 2].str.trim())
  resData.other = otherCharges
  resData.trans = data[transIndex + 2].str.trim()
  let gstCharges = Number(data[gstIndex + 2].str.trim()) * 2
  resData.gst = gstCharges
  resData.total = Math.abs(Number(data[amountIndex + 2].str.trim()))
  resData.assetsArray = assetsArray
  return resData
}
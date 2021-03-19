const _ = require('lodash')

module.exports.abBrokerNote = (data) => {

  let resData = {};

  let indexBroker = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'CONTRACT NOTE CUM TAX INVOICE'
  })
  let indexDate = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Trade Date'
  })
  let indexCnnum = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Contract Note No.'
  })
  let setIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Settlement Number'
  })
  let charges = _.keys(_.pickBy(data, { str: 'Total (Net)' }))
  let indexSTT = Number(charges[0])
  let indexGST = Number(charges[1])
  resData.date = data[indexDate - 1].str.trim()
  resData.broker = data[indexBroker - 1].str.trim()
  resData.cnnum = data[indexCnnum - 2].str.trim()
  resData.stt = data[indexSTT - 2].str.trim()
  resData.stamp = data[indexSTT - 5].str.trim()
  let otherCharges = data[indexSTT - 7].str.trim() == 'NSE' ? data[indexSTT - 4].str.trim() : Number(data[indexSTT - 4].str.trim()) + Number(data[indexSTT - 6].str.trim())
  resData.other = otherCharges
  resData.trans = data[indexSTT - 3].str.trim()
  let gstCharges = Math.abs(Number(data[indexGST - 2].str.trim()) + Number(data[indexGST - 3].str.trim()) + Number(data[indexGST - 4].str.trim()))
  resData.gst = gstCharges
  resData.total = Math.abs(Number(data[indexGST - 6].str.trim().replace(',', '')))
  let y = data[setIndex + 1].y
  let assetsArray = []

  let increment = 12.24
  while (true) {
    let selectedData = _.filter(data, function (obj) {
      if (obj.y == y) {
        return obj
      }
    })
    if (selectedData.length < 2) { break; }
    y += increment
    y = Number(y.toFixed(4))
    singleObj = {}
    singleObj.name = selectedData[5].str.trim()
    singleObj.date = data[indexDate - 1].str.trim()
    singleObj.transaction = Number(selectedData[2].str.trim()) < 0 ? 'Sell' : 'Buy'
    singleObj.quantity = Math.abs(Number(selectedData[2].str.trim()))
    singleObj.price = Math.abs(Number(selectedData[1].str.trim()))
    singleObj.brokerage = ''
    singleObj.amount = Math.abs(Number(selectedData[0].str.trim().replace(',', '')))
    assetsArray.push(singleObj)
  }
  resData.assetsArray = assetsArray
  return resData
}
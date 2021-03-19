const _ = require('lodash')

module.exports.hsBrokerNote = (data) => {

  let indexBroker, indexDate, indexCnnum, sttIndex, stIndex = 0, cgstIndex, sgstIndex, transIndex, stTransIndex, otherIndex, stOtherIndex, stampIndex, totalIndex, resData = {}

  if (data[0].str == 'CONTRACT NOTE CUM TAX INVOICE') {
    indexBroker = 3 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'CONTRACT NOTE CUM TAX INVOICE'
    })
    indexDate = 6 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Invoice No.'
    })
    indexCnnum = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Invoice No.'
    })

    sttIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Securities Transaction Tax (Rs.)'
    })

    cgstIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'CGST Amount (Rs.) *'
    })

    sgstIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'SGST Amount (Rs.) *'
    })

    igstIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'IGST Amount (Rs.) *'
    })

    transIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Rs.) #'
    })

    otherIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Taxable value of supply (SEBI turnover Fees) (Rs.)'
    })

    stampIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Stamp Duty (Rs.)'
    })

    totalIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Net amount receivable by Client / (payable by Client) (Rs.)'
    })
  } else {
    indexBroker = 2 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'CONTRACT NOTE '
    })
    indexDate = 2 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Clearing / Trading No.'
    })
    indexCnnum = 1 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Clearing / Trading No.'
    })

    sttIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Securities  Transaction Tax (Rs.)'
    })

    stIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Service Tax (15% of Brokerage) (Rs.)**'
    })

    transIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Exchange Transaction Charges (Rs.)'
    })

    stTransIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Service Tax on Exchange Transaction Charges (Rs.)'
    })

    otherIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'SEBI turnover Fees (Rs.)'
    })

    stOtherIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Service Tax on SEBI turnover Fees (Rs.)'
    })

    stampIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Stamp Duty (Rs.)'
    })

    totalIndex = 5 + _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Net amount receivable by Client /(payable by Client) (Rs.)'
    })
  }

  resData.date = data[indexDate].str.trim()
  resData.broker = data[indexBroker].str.trim()
  resData.cnnum = data[indexCnnum].str.trim()
  resData.stt = Number(data[sttIndex].str.trim())
  resData.stamp = Number(data[stampIndex].str.trim())
  resData.other = Number(data[otherIndex].str.trim())
  resData.trans = Number(data[transIndex].str.trim())
  if (stIndex != 0) {
    resData.gst = Number(data[stIndex].str.trim()) + Number(data[stOtherIndex].str.trim()) + Number(data[stTransIndex].str.trim())
  } else {
    resData.gst = Number(data[cgstIndex].str.trim()) + Number(data[sgstIndex].str.trim()) + Number(data[igstIndex].str.trim())
  }
  resData.total = data[totalIndex].str.trim()

  let startIndex = 2 + _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Remarks'
  })

  let y = data[startIndex].y

  let assetsArray = []

  while (true) {
    let selectedData = _.filter(data, function (obj) {
      if (obj.y == y) {
        return obj
      }
    })
    if (selectedData.length < 6) {
      break
    } else {
      singleObj = {}
      singleObj.name = selectedData[4].str.trim()
      singleObj.date = data[indexDate].str.trim()
      singleObj.transaction = selectedData[5].str.trim() == 'S' ? 'Sell' : 'Buy'
      singleObj.quantity = selectedData[6].str.trim()
      singleObj.price = selectedData[9].str.trim()
      singleObj.brokerage = selectedData[8].str.trim()
      singleObj.amount = Math.abs(Number(selectedData[11].str.trim()))
      assetsArray.push(singleObj)
    }

    let lastIndex = selectedData.length - 1
    let newIndex = 1 + _.findIndex(data, function (obj) {
      return (obj.x == selectedData[lastIndex].x && obj.y == selectedData[lastIndex].y)
    })

    y = Number(data[newIndex].y)
  }
  resData.assetsArray = assetsArray
  return resData
}
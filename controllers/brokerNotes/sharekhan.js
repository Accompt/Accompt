const _ = require('lodash')

module.exports.skBrokerNote = (data) => {
  let resData = {}
  let indexBroker = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'CONTRACT NOTE CUM BILL'
  })
  let indexDate = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'TRADE DATE'
  })
  let indexCnnum = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'CONTRACT NOTE NO.'
  })

  resData.date = data[indexDate + 1].str.trim()
  resData.broker = data[indexBroker + 1].str.trim()
  resData.cnnum = data[indexCnnum + 1].str.trim()

  let sttIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Tax(Rs.)'
  })

  let cgstIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'CGST'
  })

  let sgstIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'SGST'
  })

  let igstIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'IGST'
  })

  let uttIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'UTT'
  })

  let transIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Charges(Rs.)'
  })

  let otherIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Fees(Rs.)'
  })

  let stampIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Stamp Duty(Rs.)'
  })

  let roundIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Difference(Rs.)'
  })

  let totalIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'by Client)(Rs.)'
  })

  resData.stt = Number(data[sttIndex + 2].str.trim())

  let CGST, SGST, IGST, UTT
  if (data[cgstIndex + 1].str == 'Rate') {
    CGST = data[cgstIndex + 2].str == 'Amount' ? 0 : Number(data[cgstIndex + 6].str)
  } else if (data[cgstIndex + 1].str == 'Amount') {
    CGST = isNaN(data[cgstIndex + 3].str) ? 0 : Number(data[cgstIndex + 4].str)
  }

  if (data[sgstIndex + 1].str == 'Rate') {
    SGST = data[sgstIndex + 2].str == 'Amount' ? 0 : Number(data[sgstIndex + 6].str)
  } else if (data[sgstIndex + 1].str == 'Amount') {
    SGST = isNaN(data[sgstIndex + 3].str) ? 0 : Number(data[sgstIndex + 4].str)
  }

  if (data[igstIndex + 1].str == 'Rate') {
    IGST = data[igstIndex + 2].str == 'Amount' ? 0 : Number(data[igstIndex + 6].str)
  } else if (data[igstIndex + 1].str == 'Amount') {
    IGST = isNaN(data[igstIndex + 3].str) ? 0 : Number(data[igstIndex + 4].str)
  }

  if (data[uttIndex + 1].str == 'Rate') {
    UTT = data[uttIndex + 2].str == 'Amount' ? 0 : Number(data[uttIndex + 6].str)
  } else if (data[uttIndex + 1].str == 'Amount') {
    UTT = isNaN(data[uttIndex + 3].str) ? 0 : Number(data[uttIndex + 4].str)
  }

  resData.stamp = Number(data[stampIndex + 2].str.trim())
  resData.other = Number(data[otherIndex + 2].str.trim()) + Number(data[roundIndex + 2].str.trim())
  resData.trans = Number(data[transIndex + 2].str.trim())
  resData.gst = CGST + SGST + IGST + UTT
  resData.total = data[totalIndex + 2].str.includes(')') ? Math.abs(Number(data[totalIndex + 3].str.split(' ')[1].trim())) : Math.abs(Number(data[totalIndex + 2].str.trim()))

  let setIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Nse Equity'
  })

  let y, nameIndex
  if (isNaN(data[setIndex + 4].str)) {
    y = data[setIndex + 5].y
    nameIndex = setIndex + 3
  } else {
    y = data[setIndex + 3].y
    nameIndex = -1
  }
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
      singleObj.name = nameIndex < 0 ? selectedData[0].str.trim() : data[nameIndex].str + " " + data[nameIndex + 1].str
      let i = nameIndex < 0 ? 0 : 1
      singleObj.date = data[indexDate + 1].str.trim()
      singleObj.transaction = Number(selectedData[6 - i].str.trim()) < 0 ? 'Sell' : 'Buy'
      singleObj.quantity = selectedData[1 - i].str.trim()
      singleObj.price = selectedData[4 - i].str.trim()
      singleObj.brokerage = selectedData[3 - i].str.trim()
      singleObj.amount = Math.abs(Number(selectedData[6 - i].str.trim()))
      assetsArray.push(singleObj)
    }

    let lastIndex = selectedData.length - 1
    let newIndex = _.findIndex(data, function (obj) {
      return (obj.x == selectedData[lastIndex].x && obj.y == selectedData[lastIndex].y)
    })

    if (isNaN(data[newIndex + 4].str)) {
      y = data[newIndex + 5].y
      nameIndex = newIndex + 3
    } else {
      y = data[newIndex + 3].y
      nameIndex = -1
    }
    y = Number(y)
  }
  resData.assetsArray = assetsArray
  return resData
}
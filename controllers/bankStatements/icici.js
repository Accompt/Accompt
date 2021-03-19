const _ = require('lodash')

module.exports.iciciBankStatement = (data) => {

  let accIndex = _.findIndex(data, function (obj) {
    return obj.str.trim().includes("Account No")
  })

  let setIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == "Balance"
  })

  let depositX = _.findIndex(data, function (obj) {
    return obj.str.trim() == "Deposit"
  })
  depositX = data[depositX].x

  if (setIndex != -1) {
    let accNo = data[accIndex + 1].str.trim()

    let rowIndex = setIndex + 1
    let assetsArray = []
    let count = 1;
    while (true) {
      if (data[rowIndex].str.trim() == "Transaction Description :") { break; }
      if (data[rowIndex].str.trim() == "Page 1 of") {
        rowIndex += 2;
        console.log("PAGE 1 OF")
      }

      singleObj = {}
      singleObj.date = data[rowIndex].str.trim()
      rowIndex++
      singleObj.narr = data[rowIndex].str.trim()
      rowIndex++


      while (data[rowIndex].x == data[rowIndex - 1].x) {
        singleObj.narr += `${data[rowIndex].str.trim()}`
        rowIndex++
      }

      singleObj.chqNo = ""
      if (!data[rowIndex].str.trim().includes('/')) {
        singleObj.chqNo = data[rowIndex].str.trim()
        rowIndex++
      }
      rowIndex++
      if (data[rowIndex].x < depositX) {
        singleObj.cr = data[rowIndex].str.trim()
        singleObj.dr = "0.00"
        if (data[rowIndex].str.trim().slice(-1) == '.') {
          rowIndex++
          singleObj.cr += data[rowIndex].str.trim()
        }
      } else {
        singleObj.cr = "0.00"
        singleObj.dr = data[rowIndex].str.trim()
        if (data[rowIndex].str.trim().slice(-1) == '.') {
          rowIndex++
          singleObj.dr += data[rowIndex].str.trim()
        }
      }
      rowIndex++
      singleObj.balance = data[rowIndex].str.trim()
      rowIndex++
      assetsArray.push(singleObj)
      count++
    }
    return { assetsArray, accNo }
  }
}
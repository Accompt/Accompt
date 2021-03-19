const _ = require('lodash')

module.exports.hdfcBankStatement = (data) => {

  let setIndexAcc = _.findIndex(data, function (obj) {
    return obj.str.trim() == "Account No"
  })

  let accNo;

  console.log(setIndexAcc, data[83])
  if (setIndexAcc == 82) {
    accNo = data[83].str.split(':')[1].trim();
  } else {
    accNo = data[33].str.split(':')[1].trim();

  }

  let setIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == 'Closing Balance*'
  })
  if (setIndexAcc == 82) {
    setIndex = _.findIndex(data, function (obj) {
      return obj.str.trim() == 'Closing Balance'
    })
  }


  let rowIndex = setIndex + 1
  let assetsArray = []

  while (true) {
    if (setIndexAcc == 82) {
      if (data[rowIndex].str.trim() == "STATEMENT SUMMARY  :-") { break; }
      let y = data[rowIndex].y
      singleObj = {}
      singleObj.date = data[rowIndex].str.trim()
      rowIndex++
      singleObj.narr = data[rowIndex].str.trim()
      rowIndex++
      singleObj.chqNo = data[rowIndex].str.trim()
      rowIndex += 2
      console.log("=============================================")
      console.log(data[rowIndex + 1].x, data[rowIndex].x, data[rowIndex + 1].x - data[rowIndex].x)
      console.log("=============================================")
      if (data[rowIndex + 1].x - data[rowIndex].x > 100) {
        singleObj.cr = data[rowIndex].str.trim()
        singleObj.dr = 0
      } else {
        singleObj.cr = 0
        singleObj.dr = data[rowIndex].str.trim()
      }
      rowIndex++
      singleObj.balance = data[rowIndex].str.trim()
      rowIndex++
      if (data[rowIndex].x == 72.031) {
        singleObj.narr += data[rowIndex].str.trim()
        rowIndex++
      }
      console.log("=============================================")
      console.log(singleObj, data[rowIndex].str.trim())
      console.log("=============================================")
    } else {
      if (data[rowIndex].str.trim() == 'Cr Count') { break; }
      let y = data[rowIndex].y
      singleObj = {}
      singleObj.date = data[rowIndex].str.trim()
      rowIndex++
      singleObj.narr = ""
      if (data[rowIndex].y != y) {
        singleObj.narr = data[rowIndex].str.trim()
        rowIndex++
      }
      singleObj.narr = singleObj.narr + " " + data[rowIndex].str.trim()
      rowIndex++
      if (data[rowIndex].y != y) {
        singleObj.narr = singleObj.narr + " " + data[rowIndex].str.trim()
        rowIndex++
      }
      singleObj.chqNo = data[rowIndex].str.trim().length == 6 ? data[rowIndex].str.trim() : ""
      rowIndex += 2
      singleObj.cr = data[rowIndex].str.trim()
      rowIndex++
      singleObj.dr = data[rowIndex].str.trim()
      rowIndex++
      singleObj.balance = data[rowIndex].str.trim()
      rowIndex++
    }
    assetsArray.push(singleObj)
  }
  return { assetsArray, accNo }
}
const _ = require('lodash')

module.exports.idbiBankStatement = (data, pdfData) => {

  let setIndex = _.findIndex(data, function (obj) {
    return obj.str.trim() == "Balance"
  })


  if (setIndex != -1) {
    let index = _.findIndex(data, function (obj) {
      return obj.str.trim().includes(":  ") && obj.str.trim().length == 19
    })

    let accNo = data[index].str.split(":").pop().trim()
    let rowIndex = setIndex + 1
    let assetsArray = []

    while (true) {
      if (data[rowIndex].str.trim() == "Statement Summary  :-") { break; }
      if (data[rowIndex].str.trim() == "IDBI Bank Ltd. Regd. Office: IDBI Tower, WTC Complex, Mumbai 400005. Website:www.idbi.com") {
        rowIndex = _.findIndex(data, function (obj) {
          return obj.str.trim() == "Balance"
        }, rowIndex)
        rowIndex++
      }
      rowIndex++
      singleObj = {}
      singleObj.date = data[rowIndex].str.trim()
      rowIndex += 2
      singleObj.narr = data[rowIndex].str.trim()
      rowIndex++
      singleObj.chqNo = ""
      if (data[rowIndex].str.trim().length > 2) {
        singleObj.chqNo = data[rowIndex].str.trim()
        rowIndex++
      }
      if (data[rowIndex].str.trim() == "DR") {
        singleObj.cr = data[rowIndex + 2].str.trim()
        singleObj.dr = "0.00"
      } else {
        singleObj.cr = "0.00"
        singleObj.dr = data[rowIndex + 2].str.trim()
      }
      rowIndex += 3
      singleObj.balance = data[rowIndex].str.trim()
      rowIndex++
      assetsArray.push(singleObj)
      if (data[rowIndex].str.trim() == "YOUR SAVINGS A/C STATUS") {
        if (pdfData.pages.length == 1) {
          break;
        } else {
          rowIndex += 11
        }
      }
      if (data[rowIndex].str.trim() == "Page 2 of" || data[rowIndex].str.trim() == "Page 3 of") {
        rowIndex += 4
      }
      if (data[rowIndex].str.trim() == "Statement Summary:-") {
        break;
      }
    }
    return { assetsArray, accNo }
  } else {
    let index = _.findIndex(data, function (obj) {
      return obj.str.trim().includes(": ") && obj.str.trim().length == 18
    })

    let accNo = data[index].str.split(":").pop().trim()

    let setIndex = _.findIndex(data, function (obj) {
      return obj.str.trim() == "(INR)"
    })

    if (setIndex == -1) {
      setIndex = _.findIndex(data, function (obj) {
        return obj.str.trim() == "Amount (INR)"
      })
      let rowIndex = setIndex + 1
      let assetsArray = []
      while (true) {
        singleObj = {}
        singleObj.date = data[rowIndex].str.trim()
        rowIndex++
        singleObj.narr = data[rowIndex].str.trim()
        rowIndex++
        singleObj.chqNo = ""
        if (data[rowIndex].str.trim().length > 3) {
          singleObj.chqNo = data[rowIndex].str.trim()
          rowIndex++
        }
        if (data[rowIndex].str.trim() == "Dr.") {
          singleObj.cr = data[rowIndex + 2].str.trim()
          singleObj.dr = "0.00"
        } else {
          singleObj.cr = "0.00"
          singleObj.dr = data[rowIndex + 2].str.trim()
        }
        rowIndex += 5
        singleObj.balance = data[rowIndex].str.trim()
        rowIndex++
        assetsArray.push(singleObj)
        if (data[rowIndex].str.trim() == "YOUR SAVINGS A/C STATUS" || data[rowIndex].str.trim() == "YOUR A/C STATUS") {
          if (pdfData.pages.length == 1) {
            break;
          } else {
            rowIndex += 11
          }
        }

        if (data[rowIndex].str.trim() == "Page 2 of" || data[rowIndex].str.trim() == "Page 3 of" || data[rowIndex].str.trim() == "Page 4 of" || data[rowIndex].str.trim() == "Page 5 of" || data[rowIndex].str.trim() == "Page 6 of" || data[rowIndex].str.trim() == "Page 7 of" || data[rowIndex].str.trim() == "Page 8 of") {
          rowIndex += 4
        } else if (data[rowIndex].str.trim() == "Debits") {
          break;
        }
        if (data[rowIndex].str.trim() == "Statement Summary:-") {
          break;
        }
      }
      return { assetsArray, accNo }
    } else {
      let rowIndex = setIndex + 1
      let assetsArray = []
      while (true) {
        singleObj = {}
        singleObj.date = data[rowIndex].str.trim()
        rowIndex++
        singleObj.narr = data[rowIndex].str.trim()
        rowIndex++
        singleObj.chqNo = ""
        if (data[rowIndex].str.trim().length > 3) {
          singleObj.chqNo = data[rowIndex].str.trim()
          rowIndex++
        }
        if (data[rowIndex].str.trim() == "Dr.") {
          singleObj.cr = data[rowIndex + 2].str.trim()
          singleObj.dr = "0.00"
        } else {
          singleObj.cr = "0.00"
          singleObj.dr = data[rowIndex + 2].str.trim()
        }
        rowIndex += 5
        singleObj.balance = data[rowIndex].str.trim()
        rowIndex++
        assetsArray.push(singleObj)
        if (data[rowIndex].str.trim() == "YOUR SAVINGS A/C STATUS") {
          if (pdfData.pages.length == 1) {
            break;
          } else {
            rowIndex += 11
          }
        }
        if (data[rowIndex].str.trim() == "Page 2 of" || data[rowIndex].str.trim() == "Page 3 of") {
          rowIndex += 4
        } else if (data[rowIndex].str.trim() == "Debits") {
          break;
        }
        if (data[rowIndex].str.trim() == "Statement Summary:-") {
          break;
        }
      }
      return { assetsArray, accNo }
    }
  }
}
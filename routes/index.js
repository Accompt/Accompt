var express = require('express')
var router = express.Router()
const fs = require('fs')
const shelljs = require('shelljs')
const multer = require('multer')
const mime = require('mime')
const PDFExtract = require('pdf.js-extract').PDFExtract
const pdfExtract = new PDFExtract()
const _ = require('lodash')


router.get('/', async function (req, res) {
  res.render('index')
})

var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    var dirName = 'public/attachments/pdfFiles'
    if (!fs.existsSync(dirName)) {
      shelljs.mkdir('-p', dirName)
    }
    callback(null, './' + dirName)
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '.' + mime.extension(file.mimetype))
  }
})

// for single files
let uploadPdfFile = multer({ storage: storage }).single('pdfFile')

router.post('/uploadPdfFile', function (req, res) {
  uploadPdfFile(req, res, function (err) {
    if (err) {
      let response = {
        resCode: '111',
        resMessage: 'Sorry! Some Error Occured while uploading. Try Again.',
        error: err
      }
      console.log('UPLOAD ERROR : ', err)
      res.send(response)
    } else {
      if (err) return console.log(err);
      // console.log(data.pages[0].content);
      let response = {
        resCode: '000',
        resMessage: 'PDF File Uploaded Successfully.',
      }
      res.send(response)
    }
  })
})

router.post('/extractData', function (req, res) {
  let password = req.body.password
  let path = 'public/attachments/pdfFiles/pdfFile.pdf'
  pdfExtract.extract(path, { password: password }, (err, data) => {
    // console.log(data.pages[0].content);
    let response = {
      resCode: '000',
      resMessage: 'Data Extracted Successfully.',
      resData: data.pages[0].content
    }
    res.send(response)
  });
})

router.post('/api/extractData', function (req, res) {
  let password = req.body.password
  let brokerType = req.body.brokerType
  let path = 'public/attachments/pdfFiles/pdfFile.pdf'
  pdfExtract.extract(path, { password: password }, (err, pdfData) => {
    // console.log(data.pages[0].content);
    let resData = {}
    let data = pdfData.pages[0].content
    data = _.filter(data, function (obj) {
      if (!(obj.str == '' || obj.str == ' ')) {
        return obj
      }
    })
    if (brokerType == 1) {
      let indexBroker = _.findIndex(data, function (obj) {
        return obj.str == 'CONTRACT NOTE CUM TAX INVOICE'
      })
      let indexDate = _.findIndex(data, function (obj) {
        return obj.str == 'Trade Date'
      })
      let indexCnnum = _.findIndex(data, function (obj) {
        return obj.str == 'Contract Note No.'
      })
      let setIndex = _.findIndex(data, function (obj) {
        return obj.str == 'Settlement Number'
      })
      let charges = _.keys(_.pickBy(data, { str: 'Total (Net)' }))
      let indexSTT = Number(charges[0])
      let indexGST = Number(charges[1])
      resData.date = data[indexDate - 1].str
      resData.broker = data[indexBroker - 1].str
      resData.cnnum = data[indexCnnum - 2].str
      resData.stt = data[indexSTT - 2].str
      resData.stamp = data[indexSTT - 5].str
      let otherCharges = data[indexSTT - 7].str == 'NSE' ? data[indexSTT - 4].str : Number(data[indexSTT - 4].str) + Number(data[indexSTT - 6].str)
      resData.other = otherCharges
      resData.trans = data[indexSTT - 3].str
      let gstCharges = Math.abs(Number(data[indexGST - 2].str) + Number(data[indexGST - 3].str) + Number(data[indexGST - 4].str))
      resData.gst = gstCharges
      resData.total = Math.abs(Number(data[indexGST - 6].str.replace(',', '')))
      let y = data[setIndex + 1].y
      let assetsArray = []
      console.log(y)
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
        singleObj.name = selectedData[5].str
        singleObj.date = data[indexDate - 1].str
        singleObj.transaction = Number(selectedData[2].str) < 0 ? 'Sell' : 'Buy'
        singleObj.quantity = Math.abs(Number(selectedData[2].str))
        singleObj.price = Math.abs(Number(selectedData[1].str))
        // console.log(selectedData[0].str.replace(',', ''))
        singleObj.amount = Math.abs(Number(selectedData[0].str.replace(',', '')))
        assetsArray.push(singleObj)
      }
      resData.assetsArray = assetsArray
    } else if (brokerType == 2) {
      let indexBroker = _.findIndex(data, function (obj) {
        return obj.str == 'CONTRACT NOTE CUM TAX INVOICE'
      })
      let indexDate = _.findIndex(data, function (obj) {
        return obj.str == 'Trade Date'
      })
      let indexCnnum = _.findIndex(data, function (obj) {
        return obj.str == 'Contract Note No.'
      })
      let sstIndex = _.findIndex(data, function (obj) {
        return obj.str == 'STT'
      })
      let brokerageIndex = _.findLastIndex(data, function (obj) {
        return obj.str == 'Brokerage'
      })
      let transIndex = _.findIndex(data, function (obj) {
        return obj.str == 'Transaction Charges'
      })
      let stampIndex = _.findIndex(data, function (obj) {
        return obj.str == 'Stamp Duty'
      })
      let otherIndex = _.findIndex(data, function (obj) {
        return obj.str == 'Taxable value of supply'
      })
      let gstIndex = _.findIndex(data, function (obj) {
        return obj.str == 'CGST@9%'
      })
      let amountIndex = _.findIndex(data, function (obj) {
        return obj.str == 'Net amount'
      })

      resData.date = data[indexDate + 1].str
      resData.cnnum = data[indexCnnum + 1].str
      resData.broker = data[indexBroker + 2].str

      let initialRow = _.findIndex(data, function (obj) {
        return obj.str == 'MTF'
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

        console.log('ROW INDEX => ', rowIndex)
        let name = data[rowIndex + 4].str
        rowIndex = data[rowIndex + 4].x == data[rowIndex + 5].x ? rowIndex + 1 : rowIndex
        console.log(name)
        console.log(nextObj10, nextObj16, nextObj20, nextObj26)

        singleObj = {}
        singleObj.name = name
        singleObj.date = data[indexDate + 1].str
        singleObj.transaction = data[rowIndex + 5].str
        singleObj.quantity = data[rowIndex + 6].str
        singleObj.price = data[rowIndex + 8].str
        singleObj.brokerage = data[rowIndex + 9].str
        // console.log(selectedData[0].str.replace(',', ''))
        singleObj.amount = Math.abs(Number(data[rowIndex + 11].str))
        assetsArray.push(singleObj)
        if (nextObj10 != undefined && nextObj10.str != 'Description') {
          y = y + 10
        } else if (nextObj16 != undefined && nextObj16.str != 'Description') {
          y = y + 16
        } else if (nextObj20 != undefined && nextObj20.str != 'Description') {
          y = y + 20
        } else if (nextObj26 != undefined && nextObj26.str != 'Description') {
          y = y + 26
        } else {
          break
        }
      }
      resData.stt = data[sstIndex + 2].str
      resData.stamp = data[stampIndex + 2].str
      console.log(data[brokerageIndex + 2].str, data[otherIndex + 2].str)
      let otherCharges = Number(data[brokerageIndex + 2].str) + Number(data[otherIndex + 2].str)
      resData.other = otherCharges
      resData.trans = data[transIndex + 2].str
      let gstCharges = Number(data[gstIndex + 2].str) * 2
      resData.gst = gstCharges
      resData.total = Math.abs(Number(data[amountIndex + 2].str))
      resData.assetsArray = assetsArray
    }

    let response = {
      resCode: '000',
      resMessage: 'Data Extracted Successfully.',
      resData: resData
    }
    res.send(response)
  });
})
module.exports = router
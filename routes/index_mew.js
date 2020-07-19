
var express = require('express')
var router = express.Router()
const fs = require('fs')
const shelljs = require('shelljs')
const multer = require('multer')
const mime = require('mime')
const PDFExtract = require('pdf.js-extract').PDFExtract
const pdfExtract = new PDFExtract()
const _ = require('lodash')
const pdf = require('pdf-parse');


router.get('/', async function (req, res) {
  res.render('index')
})

router.get('/bankStatement', async function (req, res) {
  res.render('bankStatement')
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
  pdfExtract.extract(path, { password: password }, (err, pdfData) => {
    if (err) {
      console.log(err)
    }
    let data = []
    pdfData.pages.forEach(page => {
      data = data.concat(page.content)
    });
    let response = {
      resCode: '000',
      resMessage: 'Data Extracted Successfully.',
      resData: data
    }
    res.send(response)
  });
})

router.post('/api/form16', function (req, res) {
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
      let password = req.body.password
      let brokerType = req.body.brokerType
      let path = 'public/attachments/pdfFiles/form16/pdfFile.pdf'
      pdfExtract.extract(path, { password: password }, (err, pdfData) => {
        if (err) {
          console.log(err)
          return res.send({
            resCode: '404',
            resMessage: err.message,
          })
        }
        let resData = {}
        // let data = pdfData.pages[0].content
        let data = []
        pdfData.pages.forEach(page => {
          data = data.concat(page.content)
        });

        data = _.filter(data, function (obj) {
          if (!(obj.str.trim() == '' || obj.str.trim() == ' ')) {
            return obj
          }
        })

        if (brokerType == 1) {
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
        } else if (brokerType == 2) {
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
        } else if (brokerType == 3) {
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
        } else if (brokerType == 4) {
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
        } else if (brokerType == 5) {
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
              // console.log('------------------------------------------------------')
              // console.log(selectedData)
              // console.log('------------------------------------------------------')

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
        } else if (brokerType == 6) {

          let indexBroker, indexDate, indexCnnum, sttIndex, stIndex = 0, cgstIndex, sgstIndex, transIndex, stTransIndex, otherIndex, stOtherIndex, stampIndex, totalIndex

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
              // console.log('------------------------------------------------------')
              // console.log(selectedData)
              // console.log('------------------------------------------------------')

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
        }

        let response = {
          resCode: '000',
          resMessage: 'Data Extracted Successfully.',
          resData: resData,
          // arrayData: data
        }

        console.log(req.headers.origin)

        res.send(response)
      });
    }
  })
})

router.post('/api/bankStatement', function (req, res) {
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
      let password = req.body.password
      let bankType = req.body.bankType
      let path = 'public/attachments/pdfFiles/pdfFile.pdf'


      try {
        if (bankType == 1) {
          pdfExtract.extract(path, { password: password }, (err, pdfData) => {
            if (err) {
              console.log(err)
              return res.send({
                resCode: '404',
                resMessage: err.message,
              })
            }
            let resData = {}
            let data = []
            pdfData.pages.forEach(page => {
              data = data.concat(page.content)
            });

            data = _.filter(data, function (obj) {
              if (!(obj.str.trim() == '' || obj.str.trim() == ' ')) {
                return obj
              }
            })

            resData.accNo = data[33].str.split(' ')[1].trim();

            let setIndex = _.findIndex(data, function (obj) {
              return obj.str.trim() == 'Closing Balance*'
            })

            let rowIndex = setIndex + 1
            let assetsArray = []

            while (true) {
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
              assetsArray.push(singleObj)
            }
            resData.assetsArray = assetsArray


            let response = {
              resCode: '000',
              resMessage: 'Data Extracted Successfully.',
              resData: resData,
              arrayData: data
            }

            console.log(req.headers.origin)

            res.send(response)
          });
        } else if (bankType == 2) {
          let dataBuffer = fs.readFileSync(path);
          let resData = {}

          pdf(dataBuffer).then(function (data) {
            console.log(data.text);
            data = data.text.split("\n")

            data = _.filter(data, function (obj) {
              if (!(obj.trim() == '' || obj.trim() == ' ')) {
                return obj.trim()
              }
            })

            {
              resData.accNo = data[5].split(' ')[1].trim();

              let setIndex = _.findIndex(data, function (obj) {
                return obj.trim() == '"NARATIONCODDEBITCREDITBALANCE"'
              })

              let rowIndex = setIndex + 1
              let assetsArray = []

              while (true) {
                if (rowIndex == data.length) { break; }
                let date = data[rowIndex]
                singleObj = {}
                singleObj.date = date.subString(0, 11).split("-")
                switch (singleObj.date[1]) {
                  case 'JAN': singleObj.date[1] = '01'
                    break
                  case 'FEB': singleObj.date[1] = '02'
                    break
                  case 'MAR': singleObj.date[1] = '03'
                    break
                  case 'APR': singleObj.date[1] = '04'
                    break
                  case 'MAY': singleObj.date[1] = '05'
                    break
                  case 'JUN': singleObj.date[1] = '06'
                    break
                  case 'JUL': singleObj.date[1] = '07'
                    break
                  case 'AUG': singleObj.date[1] = '08'
                    break
                  case 'SEP': singleObj.date[1] = '09'
                    break
                  case 'OCT': singleObj.date[1] = '10'
                    break
                  case 'NOV': singleObj.date[1] = '11'
                    break
                  case 'DEC': singleObj.date[1] = '12'
                    break
                }
                singleObj.date = singleObj.date.join('-')
                if (date.split(" ").pop() == "") {
                  singleObj.chqNo = data[rowIndex].trim()
                  rowIndex++
                  singleObj.narr = data[rowIndex].trim()
                  rowIndex++
                } else {
                  singleObj.narr = date.substring(11)
                  rowIndex++
                }

                if (data[rowIndex].split("         ")[1] == undefined) {
                  singleObj.narr = data[rowIndex].str.trim()
                  rowIndex++
                }
                singleObj.cr = data[rowIndex].split("         ")[1].str.trim()
                rowIndex++
                singleObj.dr = data[rowIndex].str.trim()
                rowIndex++
                singleObj.balance = data[rowIndex].str.trim()
                rowIndex++
                assetsArray.push(singleObj)
              }
              resData.assetsArray = assetsArray
            }

            let response = {
              resCode: '000',
              resMessage: 'Data Extracted Successfully.',
              resData: data,
              arrayData: data
            }

            console.log(req.headers.origin)

            res.send(response)

          });
        }
      } catch (err) {
        console.log(err)
        res.send
      }
    }
  })
})



router.post('/api/bankStatementNew', function (req, res) {
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
      let password = req.body.password
      let bankType = req.body.bankType
      let path = 'public/attachments/pdfFiles/pdfFile.pdf'

      let dataBuffer = fs.readFileSync(path);

      pdf(dataBuffer).then(function (data) {
        console.log(data.text);
        data = data.text.split("\n")

        data = _.filter(data, function (obj) {
          if (!(obj.trim() == '' || obj.trim() == ' ')) {
            return obj.trim()
          }
        })

        let response = {
          resCode: '000',
          resMessage: 'Data Extracted Successfully.',
          resData: data,
          arrayData: data
        }

        console.log(req.headers.origin)

        res.send(response)

      });
    }
  })
})

router.post('/api/extractData', function (req, res) {
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
      let password = req.body.password
      let brokerType = req.body.brokerType
      let path = 'public/attachments/pdfFiles/pdfFile.pdf'
      pdfExtract.extract(path, { password: password }, (err, pdfData) => {
        if (err) {
          console.log(err)
          return res.send({
            resCode: '404',
            resMessage: err.message,
          })
        }
        let resData = {}
        // let data = pdfData.pages[0].content
        let data = []
        pdfData.pages.forEach(page => {
          data = data.concat(page.content)
        });

        data = _.filter(data, function (obj) {
          if (!(obj.str.trim() == '' || obj.str.trim() == ' ')) {
            return obj
          }
        })

        if (brokerType == 1) {
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
        } else if (brokerType == 2) {
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
        } else if (brokerType == 3) {
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
        } else if (brokerType == 4) {
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
        } else if (brokerType == 5) {
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
              // console.log('------------------------------------------------------')
              // console.log(selectedData)
              // console.log('------------------------------------------------------')

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
        } else if (brokerType == 6) {

          let indexBroker, indexDate, indexCnnum, sttIndex, stIndex = 0, cgstIndex, sgstIndex, transIndex, stTransIndex, otherIndex, stOtherIndex, stampIndex, totalIndex

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
              // console.log('------------------------------------------------------')
              // console.log(selectedData)
              // console.log('------------------------------------------------------')

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
        }

        let response = {
          resCode: '000',
          resMessage: 'Data Extracted Successfully.',
          arrayData: data
        }

        console.log(req.headers.origin)

        res.send(response)
      });
    }
  })
})
module.exports = router
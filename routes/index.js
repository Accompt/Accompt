var express = require('express')
var router = express.Router()
const fs = require('fs')
const shelljs = require('shelljs')
const multer = require('multer')
const mime = require('mime')
const {
  abBrokerNote,
  hsBrokerNote,
  kvBrokerNote,
  pcBrokerNote,
  skBrokerNote,
  sgBrokerNote
} = require('../controllers/brokerNotes')
const {
  hdfcBankStatement,
  idbiBankStatement,
  iciciBankStatement
} = require('../controllers/bankStatements')
const PDFExtract = require('pdf.js-extract').PDFExtract
const pdfExtract = new PDFExtract()
const _ = require('lodash')


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

        try {
          if (bankType == 1) {
            let { assetsArray, accNo } = hdfcBankStatement(data)
            resData.accNo = accNo
            resData.assetsArray = assetsArray
          } else if (bankType == 2) {
            let { assetsArray, accNo } = idbiBankStatement(data, pdfData)
            resData.accNo = accNo
            resData.assetsArray = assetsArray
          } else if (bankType == 3) {
            let { assetsArray, accNo } = iciciBankStatement(data, pdfData)
            resData.accNo = accNo
            resData.assetsArray = assetsArray
          } else {
            return res.send({
              resCode: '999',
              resMessage: 'Bank Type not found. Please select from list and try again'
            })
          }

          let response = {
            resCode: '000',
            resMessage: 'Data Extracted Successfully.',
            resData: resData,
            arrayData: data
          }

          console.log(req.headers.origin)
          res.send(response)

        } catch (err) {
          console.log(err)
          let response = {
            resCode: '999',
            resMessage: 'Format does not match. Please check and try again'
          }
          console.log(req.headers.origin)
          res.send(response)
        }
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
          resData = abBrokerNote(data)
        } else if (brokerType == 2) {
          resData = sgBrokerNote(data)
        } else if (brokerType == 3) {
          resData = kvBrokerNote(data)
        } else if (brokerType == 4) {
          resData = pcBrokerNote(data)
        } else if (brokerType == 5) {
          resData = skBrokerNote(data)
        } else if (brokerType == 6) {
          resData = hsBrokerNote(data)
        } else {
          return res.send({
            resCode: '999',
            resMessage: 'Broker Type not found. Please select from list and try again'
          })
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
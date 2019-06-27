var express = require('express')
var router = express.Router()
const fs = require('fs')
const shelljs = require('shelljs')
const multer = require('multer')
const mime = require('mime')
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();


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
      let path = 'public/attachments/pdfFiles/pdfFile.pdf'
      pdfExtract.extract(path, {}, (err, data) => {
        if (err) return console.log(err);
        // console.log(data.pages[0].content);
        let response = {
          resCode: '000',
          resMessage: 'Excel File Uploaded Successfully.',
          resData: data.pages[0].content
        }
        res.send(response)
      });
    }
  })
})

module.exports = router
const { hdfcBankStatement } = require('./hdfc')
const { idbiBankStatement } = require('./idbi')
const { iciciBankStatement } = require('./icici')

module.exports = {
  hdfcBankStatement,
  idbiBankStatement,
  iciciBankStatement
}
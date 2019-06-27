function isNumberKey(evt) {
  var charCode = (evt.which) ? evt.which : evt.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false }
  return true
}
function AvoidSpace(event) {
  var k = event ? event.which : window.event.keyCode;
  if (k == 32) return false;
}
function isDecimalKey(evt) {
  var charCode = (evt.which) ? evt.which : evt.keyCode
  if (charCode == 46 || (charCode >= 48 && charCode <= 57)) { return true }
  return false
}
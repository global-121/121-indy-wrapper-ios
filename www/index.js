var exec = require('cordova/exec')

exports.openWallet = function (success, error) {
  exec(success, error, 'Global121Indy', 'openWallet', [])
}

exports.closeWallet = function (arg0, success, error) {
  exec(success, error, 'Global121Indy', 'closeWallet', [arg0])
}

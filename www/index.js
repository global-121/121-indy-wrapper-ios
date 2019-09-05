var exec = require('cordova/exec')

exports.setup = function (success, error) {
  exec(success, error, 'Global121Indy', 'setup', [])
}

exports.createWallet = function(password, success, error) {
  exec(success, error, "Global121Indy", "createWallet", [password])
}

exports.openWallet = function (success, error) {
  exec(success, error, 'Global121Indy', 'openWallet', [])
}

exports.closeWallet = function (arg0, success, error) {
  exec(success, error, 'Global121Indy', 'closeWallet', [arg0])
}

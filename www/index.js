var exec = require('cordova/exec')

exports.openWallet = function (arg0, success, error) {
  exec(success, error, 'Global121Indy', 'openWallet', [arg0])
}

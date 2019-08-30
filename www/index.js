var exec = require('cordova/exec')

exports.createWallet = function (arg0, success, error) {
  exec(success, error, 'Global121Indy', 'createWallet', [arg0])
}

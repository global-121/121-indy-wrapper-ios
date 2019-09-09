var exec = require('cordova/exec')

exports.setup = function (success, error) {
  exec(success, error, 'Global121Indy', 'setup', [])
}

exports.createWallet = function(password, success, error) {
  exec(success, error, "Global121Indy", "createWallet", [password])
}

exports.deleteWallet = function(password, success, error) {
  exec(success, error, "Global121Indy", "deleteWallet", [password])
}

exports.openWallet = function (password, success, error) {
  exec(success, error, 'Global121Indy', 'openWallet', [password])
}

exports.closeWallet = function (handle, success, error) {
  exec(success, error, 'Global121Indy', 'closeWallet', [handle])
}

exports.generateDid = function (password, success, error) {
  exports.openWallet(
    password,
    handle => {
      exec(
        (did, verificationKey) => {
          exports.closeWallet(
            handle,
            () => success("did:sov:" + did, verificationKey),
            error
          )
        },
        error,
        'Global121Indy', 'generateDid', [handle]
      )
    },
    error
  )
}

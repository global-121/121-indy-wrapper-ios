var exec = require('cordova/exec')

function setup (success, error) {
  exec(success, error, 'Global121Indy', 'setup', [])
}

function createWallet (password, success, error) {
  exec(success, error, "Global121Indy", "createWallet", [password])
}

function deleteWallet (password, success, error) {
  exec(success, error, "Global121Indy", "deleteWallet", [password])
}

function openWallet (password, success, error) {
  exec(success, error, 'Global121Indy', 'openWallet', [password])
}

function closeWallet (handle, success, error) {
  exec(success, error, 'Global121Indy', 'closeWallet', [handle])
}

function generateDid (password, success, error) {
  openWallet(
    password,
    handle => {
      exec(
        (did, verificationKey) => {
          closeWallet(
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

exports.setup = setup
exports.createWallet = createWallet
exports.deleteWallet = deleteWallet
exports.openWallet = openWallet
exports.closeWallet = closeWallet
exports.generateDid = generateDid

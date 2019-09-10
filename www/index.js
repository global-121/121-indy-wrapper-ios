var exec = require('cordova/exec')

function setup (success, error) {
  return execPromise(success, error, 'Global121Indy', 'setup', [])
}

function createWallet (password, success, error) {
  return execPromise(success, error, "Global121Indy", "createWallet", [password])
}

function deleteWallet (password, success, error) {
  return execPromise(success, error, "Global121Indy", "deleteWallet", [password])
}

function openWallet (password, success, error) {
  return execPromise(success, error, 'Global121Indy', 'openWallet', [password])
}

function closeWallet (handle, success, error) {
  return execPromise(success, error, 'Global121Indy', 'closeWallet', [handle])
}

function withOpenWallet(password, success, error, action) {
  openWallet(password,
    handle => action(handle,
      (...results) => closeWallet(handle,
        () => success(...results),
        error
      ),
      (...failure) => closeWallet(handle,
        () => error(...failure),
        () => error(...failure))
    ),
    error
  )
}

function generateDid (password, success, error) {
  withOpenWallet(password, success, error, function(handle, success, error) {
    function didGenerated(did, verificationKey) {
      success("did:sov:" + did, verificationKey)
    }
    exec(didGenerated, error, 'Global121Indy', 'generateDid', [handle])
  })
}

function execPromise (success, error, ...args) {
  if (success || error) {
    exec(success, error, ...args)
  } else {
    return new Promise((resolve, reject) => {
      exec(resolve, reject, ...args)
    })
  }
}

exports.setup = setup
exports.createWallet = createWallet
exports.deleteWallet = deleteWallet
exports.generateDid = generateDid

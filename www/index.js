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

exports.setup = setup
exports.createWallet = createWallet
exports.deleteWallet = deleteWallet
exports.generateDid = generateDid

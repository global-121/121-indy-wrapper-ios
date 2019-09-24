var exec = require('cordova/exec')

function setup (success, error) {
  return execPromise(success, error, 'Global121Indy', 'setup', [])
}

function createWallet (password, success, error) {
  return execPromise(success, error, "Global121Indy", "createWallet", [password])
}

function createMasterSecret (password, success, error) {
  return withOpenWallet(password, handle =>
    execPromise(null, null, 'Global121Indy', 'createMasterSecret', [handle]))
  .then(success, error)
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

function withOpenWallet(password, action) {
  return openWallet(password)
    .then(handle =>
      action(handle)
        .finally(() => closeWallet(handle)))
}

function generateDid (password, success, error) {
  return generateDidFromSeed(password, null, success, error)
}

function generateDidFromSeed (password, seed, success, error) {
  return withOpenWallet(password, handle =>
      execPromise(null, null, 'Global121Indy', 'generateDid', [handle, seed]))
    .then(([did]) => "did:sov:" + did)
    .then(success, error)
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
exports.createMasterSecret = createMasterSecret
exports.deleteWallet = deleteWallet
exports.generateDid = generateDid
exports.generateDidFromSeed = generateDidFromSeed

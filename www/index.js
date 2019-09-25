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
    .then(([did, verificationKey]) => ({ did: "did:sov:" + did, verificationKey }))
    .then(success, error)
}

function addTrustAnchor(
  password, submitterDid, anchorDid, anchorVerificationKey, success, error
) {
  return withOpenWallet(password, handle =>
      buildTrustAnchorRequest(submitterDid, anchorDid, anchorVerificationKey)
      .then(request => signAndSubmitRequest(handle, submitterDid, request)))
    .then(success, error)
}

function buildTrustAnchorRequest(submitterDid, anchorDid, anchorVerificationKey) {
  return execPromise(null, null, 'Global121Indy', 'buildTrustAnchorRequest',
                     [raw(submitterDid), raw(anchorDid), anchorVerificationKey])
}

function createSchema (password, did, schema, success, error) {
  return withOpenWallet(password, handle =>
    buildSchemaRequest(did, schema)
    .then(request => signAndSubmitRequest(handle, did, request)))
  .then(success, error)
}

function buildSchemaRequest(did, schema) {
  return execPromise(null, null, 'Global121Indy', 'buildSchemaRequest',
                     [raw(did), JSON.stringify(schema)])
}

function signAndSubmitRequest(handle, did, request) {
  return execPromise(null, null, 'Global121Indy', 'signAndSubmitRequest',
                     [handle, raw(did), request])
    .then(response => {
      let json = JSON.parse(response)
      if (json.result) {
        return json.result.rootHash
      } else {
        throw new Error(json.reason)
      }
    })
}

function createCredentialDefinition(password, did, schema, tag, success, error) {
  return withOpenWallet(password, handle =>
    execPromise(
      null, null, 'Global121Indy', 'createCredentialDefinition',
      [handle, raw(did), JSON.stringify(schema), tag]
    ))
  .then(([id, definition]) => ({ id, definition: JSON.parse(definition) }))
  .then(success, error)
}

function createCredentialOffer(password, credentialDefinitionId, success, error) {
  return withOpenWallet(password, handle =>
    execPromise(
      null, null, 'Global121Indy', 'createCredentialOffer',
      [handle, credentialDefinitionId]
    ))
  .then(success, error)
}

function raw(did) {
  return did.slice("did:sov:".length)
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
exports.addTrustAnchor = addTrustAnchor
exports.createSchema = createSchema
exports.createCredentialDefinition = createCredentialDefinition
exports.createCredentialOffer = createCredentialOffer

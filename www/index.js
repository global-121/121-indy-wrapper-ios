var cordovaExec = require('cordova/exec')

function exec (method, ...args) {
  return new Promise((resolve, reject) => {
    cordovaExec(resolve, reject, 'Global121Indy', method, args)
  })
}

function setup (success, error) {
  return exec('setup').then(success, error)
}

function createWallet (password, success, error) {
  return exec('createWallet', password).then(success, error)
}

function createMasterSecret (password, success, error) {
  return withOpenWallet(password, handle => exec('createMasterSecret', handle))
  .then(success, error)
}

function deleteWallet (password, success, error) {
  return exec('deleteWallet', password).then(success, error)
}

function openWallet (password, success, error) {
  return exec('openWallet', password).then(success, error)
}

function closeWallet (handle, success, error) {
  return exec('closeWallet', handle).then(success, error)
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
      exec('generateDid', handle, seed))
    .then(([did, verificationKey]) => ({ did: 'did:sov:' + did, verificationKey }))
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
  return exec('buildTrustAnchorRequest',
              raw(submitterDid), raw(anchorDid), anchorVerificationKey)
}

function createSchema (password, did, schema, success, error) {
  let name = schema.name
  let version = schema.version
  let attributes = schema.attributes
  var result = {}
  return withOpenWallet(password, handle =>
    exec('createSchema', raw(did), name, version, attributes)
    .then(([id,json]) => {
      result.id = id
      result.json = JSON.parse(json)
      return exec('buildSchemaRequest', raw(did), json)
    })
    .then(request => signAndSubmitRequest(handle, did, request))
    .then(_ => result))
  .then(success, error)
}

function signAndSubmitRequest(handle, did, request) {
  return exec('signAndSubmitRequest', handle, raw(did), request)
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
    exec('createCredentialDefinition',
         handle, raw(did), JSON.stringify(schema), tag))
  .then(([id, definition]) => ({ id, definition: JSON.parse(definition) }))
  .then(success, error)
}

function createCredentialOffer(password, credentialDefinitionId, success, error) {
  return withOpenWallet(password, handle =>
    exec('createCredentialOffer', handle, credentialDefinitionId))
  .then(success, error)
}

function raw(did) {
  return did.slice('did:sov:'.length)
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

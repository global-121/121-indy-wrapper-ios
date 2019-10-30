var cordovaExec = require('cordova/exec')

function exec (method, ...args) {
  return new Promise((resolve, reject) => {
    cordovaExec(resolve, reject, 'Global121Indy', method, args)
  })
}

function setup (success, error) {
  return exec('setup').then(success, error)
}

function createWallet ({ password }, success, error) {
  return exec('createWallet', password).then(success, error)
}

function createMasterSecret ({ password }, success, error) {
  return withOpenWallet({ password }, handle => exec('createMasterSecret', handle))
  .then(success, error)
}

function deleteWallet ({ password }, success, error) {
  return exec('deleteWallet', password).then(success, error)
}

function openWallet ({ password }, success, error) {
  return exec('openWallet', password).then(success, error)
}

function closeWallet ({ handle }, success, error) {
  return exec('closeWallet', handle).then(success, error)
}

function withOpenWallet({ password }, action) {
  return openWallet({ password })
    .then(handle =>
      action(handle)
        .finally(() => closeWallet({ handle })))
}

function generateDid ({ password }, success, error) {
  return generateDidFromSeed({ password }, success, error)
}

function generateDidFromSeed ({ password, seed }, success, error) {
  return withOpenWallet({ password }, handle =>
      exec('generateDid', handle, seed))
    .then(([did, verificationKey]) => ({ did: 'did:sov:' + did, verificationKey }))
    .then(success, error)
}

function addTrustAnchor(
  { password, submitterDid, anchorDid, anchorVerificationKey }, success, error
) {
  return withOpenWallet({ password }, handle =>
      buildTrustAnchorRequest({ submitterDid, anchorDid, anchorVerificationKey })
      .then(request => signAndSubmitRequest({ handle, did: submitterDid, request })))
    .then(success, error)
}

function buildTrustAnchorRequest({ submitterDid, anchorDid, anchorVerificationKey }) {
  return exec('buildTrustAnchorRequest',
              raw(submitterDid), raw(anchorDid), anchorVerificationKey)
}

function createSchema ({ password, did, schema }, success, error) {
  let name = schema.name
  let version = schema.version
  let attributes = schema.attributes
  var result = {}
  function buildRequest({ id, json }) {
    result.id = id
    result.json = JSON.parse(json)
    return exec('buildSchemaRequest', raw(did), json)
  }
  return withOpenWallet({ password }, handle =>
    exec('createSchema', raw(did), name, version, attributes)
    .then(([id,json]) => buildRequest({ id, json }))
    .then(request => signAndSubmitRequest({ handle, did, request }))
    .then(_ => result))
  .then(success, error)
}

function signAndSubmitRequest({ handle, did, request }) {
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

function getSchema({ id }, success, error) {
  return exec('buildGetSchemaRequest', id)
  .then(request => exec('submitRequest', request))
  .then(response => exec('parseGetSchemaResponse', response))
  .then(([id, json]) => ({ id, json: JSON.parse(json) }))
  .then(success, error)
}

function createCredentialDefinition({ password, did, schema, tag }, success, error) {
  var result = {}
  function buildRequest({ id, json }) {
    result.id = id
    result.json = JSON.parse(json)
    return exec('buildCredentialDefinitionRequest', raw(did), json)
  }
  return withOpenWallet({ password }, handle =>
    exec('createCredentialDefinition', handle, raw(did), JSON.stringify(schema), tag)
    .then(([id, json]) => buildRequest({ id, json }))
    .then(request => signAndSubmitRequest({ handle, did, request })))
    .then(_ => result)
  .then(success, error)
}

function getCredentialDefinition({ id }, success, error) {
  return exec('buildGetCredentialDefinitionRequest', id)
  .then(request => exec('submitRequest', request))
  .then(response => exec('parseGetCredentialDefinitionResponse', response))
  .then(([id, json]) => ({ id, json: JSON.parse(json) }))
  .then(success, error)
}

function createCredentialOffer({ password, credentialDefinitionId }, success, error) {
  return withOpenWallet({ password }, handle =>
    exec('createCredentialOffer', handle, credentialDefinitionId))
  .then(success, error)
}

function createCredentialRequest({ password, did, offer, credentialDefinitionId }, success, error) {
  return withOpenWallet({ password }, handle =>
    getCredentialDefinition({ id: credentialDefinitionId })
    .then(({ json }) => JSON.stringify(json))
    .then(json => exec('createCredentialRequest', handle, raw(did), offer, json)))
    .then(([json,meta]) => ({ json: JSON.parse(json), meta: JSON.parse(meta) }))
  .then(success, error)
}

function createCredential({ password, offer, request, values }, success, error) {
  return withOpenWallet({ password }, handle =>
    exec('createCredential', handle, offer, JSON.stringify(request), JSON.stringify(values)))
    .then(json => JSON.parse(json))
  .then(success, error)
}

function storeCredential({ password, definition, requestMeta, credential }, success, error) {
  return withOpenWallet({ password }, handle =>
     exec(
       'storeCredential',
       handle,
       JSON.stringify(definition),
       JSON.stringify(requestMeta),
       JSON.stringify(credential)
      ))
  .then(success, error)
}

function createProof({ password, proofRequest }, success, error) {
  return withOpenWallet({ password }, handle =>
    getPrerequisitesForProofRequest({ handle, proofRequest })
    .then(({credentials, schemas, definitions}) =>
      exec(
        'createProof',
        handle,
        JSON.stringify(proofRequest),
        JSON.stringify(credentials),
        JSON.stringify(schemas),
        JSON.stringify(definitions)
      )
    ))
    .then(proof => JSON.parse(proof))
  .then(success, error)
}

async function getPrerequisitesForProofRequest({ handle, proofRequest }) {
  let { attrs: attributes, predicates } =
    await getCredentialsForProofRequest({ handle, proofRequest })

  let credentials = {
    self_attested_attributes: {},
    requested_attributes: {},
    requested_predicates: {}
  }
  let schemas = {}
  let definitions = {}

  for (name in proofRequest.requested_attributes) {
    let options = attributes[name][0]
    if (!options) {
      continue
    }
    let credential = options.cred_info
    credentials.requested_attributes[name] = { cred_id: credential.referent, revealed: true }
    let schemaId = credential.schema_id
    let definitionId = credential.cred_def_id
    schemas[schemaId] = (await getSchema({ id: schemaId })).json
    definitions[definitionId] = (await getCredentialDefinition({ id: definitionId })).json
  }

  for (name in proofRequest.requested_predicates) {
    let options = predicates[name][0]
    if (!options) {
      continue
    }
    let credential = options.cred_info
    credentials.requested_predicates[name] = { cred_id: credential.referent }
    let schemaId = credential.schema_id
    let definitionId = credential.cred_def_id
    schemas[schemaId] = (await getSchema({ id: schemaId })).json
    definitions[definitionId] = (await getCredentialDefinition({ id: definitionId })).json
  }

  return { credentials, schemas, definitions }
}

function getCredentialsForProofRequest({ handle, proofRequest }) {
  return exec('getCredentialsForProofRequest', handle, JSON.stringify(proofRequest))
  .then(json => JSON.parse(json))
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
exports.getSchema = getSchema
exports.createCredentialDefinition = createCredentialDefinition
exports.getCredentialDefinition = getCredentialDefinition
exports.createCredentialOffer = createCredentialOffer
exports.createCredentialRequest = createCredentialRequest
exports.createCredential = createCredential
exports.storeCredential = storeCredential
exports.createProof = createProof

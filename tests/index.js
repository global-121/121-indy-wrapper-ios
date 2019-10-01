exports.defineAutoTests = function () {

  let {
    setup,
    createWallet,
    createMasterSecret,
    deleteWallet,
    generateDid,
    generateDidFromSeed,
    addTrustAnchor,
    createSchema,
    getSchema,
    createCredentialDefinition,
    getCredentialDefinition,
    createCredentialOffer,
    createCredentialRequest,
    createCredential,
    storeCredential,
    createProof
  } = Global121.Indy

  let password = "shh, secret!"
  let steward = {
    seed: '000000000000000000000000Steward1',
    did: 'did:sov:Th7MpTaRZVRYnPiabds81Y',
    verificationKey: 'FYmoFw55GeQH7SRFa37dkx1d2dZ3zUF8ckg7wmL7ofN4'
  }
  let schemaData = {
    name: 'gvt',
    version: '1.0',
    attributes: '["age", "sex", "height", "name"]'
  }

  // creating a credential definition can take a long time
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30 * 1000

  setupTest = async done => {
    try {
      let result = await setup()
      expect(result).toBeNull()
      done()
    } catch (error) {
      done.fail(error)
    }
  }

  it('performs setup', setupTest)

  // tests are not independent from each other,
  // this test relies on the setup having been done in the previous test
  it('can perform setup more than once', setupTest)

  it('can create a wallet', async done => {
    try {
      let result = await createWallet(password)
      expect(result).toBeNull()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  it('throws when wallet was already created', async done => {
    try {
      await createWallet(password)
      fail("expected wallet creation to fail")
    } catch (error) {
      expect(error).toBeDefined()
    }
    done()
  })

  it('can create a master secret for zero knowledge proofs', async done => {
    try {
      let result = await createMasterSecret(password)
      expect(result).not.toBeNull()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  it('fails creating a master secret when password is incorrect', async done => {
    try {
      await createMasterSecret('wrong password')
      fail("expected master secret creation to fail")
    } catch (error) {
      expect(error).toBeDefined()
    }
    done()
  })

  it('generates a DID', async done => {
    try {
      let { did, verificationKey } = await generateDid(password)
      expect(did).toContain('did:sov:')
      expect(verificationKey).toBeDefined()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  it('generates a DID with a seed', async done => {
    try {
      let { did, verificationKey } = await generateDidFromSeed(password, steward.seed)
      expect(did).toEqual(steward.did)
      expect(verificationKey).toEqual(steward.verificationKey)
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  it('fails generating a DID when password is incorrect', async done => {
    try {
      await generateDid("wrong password")
      fail("expected DID generation to fail")
    } catch (error) {
      expect(error).toBeDefined()
    }
    done()
  })

  var anchor

  it('adds a trust anchor to the ledger', async done => {
    try {
      anchor = await generateDid(password)
      let response = await addTrustAnchor(
        password, steward.did, anchor.did, anchor.verificationKey
      )
      expect(response).toBeDefined()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  var schema

  it('creates a schema', async done => {
    try {
      schema = await createSchema(password, anchor.did, schemaData)
      expect(schema.id).not.toBeNull()
      expect(schema.json).not.toBeNull()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  it('fails creating a schema with insufficient privileges', async done => {
    try {
      let unprivileged = await generateDid(password)
      await createSchema(password, unprivileged.did, schemaData)
      fail("expected schema creation to fail")
    } catch (error) {
      expect(error).toBeDefined()
    }
    done()
  })

  it('retrieves a schema', async done => {
    try {
      let retrieved = await getSchema(schema.id)
      expect(retrieved.id).toEqual(schema.id)
      expect(retrieved.json).not.toBeNull()
      schema = retrieved
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  var definition

  it('creates a credential definition', async done => {
    try {
      definition = await createCredentialDefinition(
        password, anchor.did, schema.json, 'tag'
      )
      expect(definition.id).toBeDefined()
      expect(definition.json).toBeDefined()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  it('retrieves a credential definition', async done => {
    try {
      let retrieved = await getCredentialDefinition(definition.id)
      expect(retrieved.id).toEqual(definition.id)
      expect(retrieved.json).toBeDefined()
      definition = retrieved
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  var offer

  it('creates a credential offer', async done => {
    try {
      offer = await createCredentialOffer(password, definition.id)
      expect(offer).toBeDefined()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  var request

  it('creates a credential request', async done => {
    try {
      request = await createCredentialRequest(password, anchor.did, offer, definition.id)
      expect(request.json).toBeDefined()
      expect(request.meta).toBeDefined()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  var credential

  it('creates a credential', async done => {
    let values = {
      sex: {raw: "male", encoded: "5944657099558967239210949258394887428692050081607692519917050011144233"},
      name: {raw: "Alex", encoded: "1139481716457488690172217916278103335"},
      height: {raw: "175", encoded: "175"},
      age: {raw: "28", encoded: "28"}
    }
    try {
      credential = await createCredential(password, offer, request.json, values)
      expect(credential).not.toBeNull()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  it("stores a credential", async done => {
    try {
      let id = await storeCredential(password, definition.json, request.meta, credential)
      expect(id).not.toBeNull()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  it("creates a proof", async done => {
    let proofRequest = {
      nonce: '123432421212',
      name: 'proof_req_1',
      version: '0.1',
      requested_attributes: {
          attr1_referent: {
              name: 'name',
              restrictions: {
                  cred_def_id: definition.id,
              }
          }
      },
      requested_predicates: {
          predicate1_referent: {
              name: 'age',
              p_type: '>=',
              p_value: 18,
              restrictions: {
                cred_def_id: definition.id,
              }
          }
      }
    }
    try {
      let proof = await createProof(password, proofRequest)
      expect(proof).not.toBeNull()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  it('can delete a wallet', async done => {
    try {
      let result = await deleteWallet(password)
      expect(result).toBeNull()
      done()
    } catch (error) {
      done.fail(error)
    }
  })
}

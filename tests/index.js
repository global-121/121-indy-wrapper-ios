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
    createCredentialDefinition,
    createCredentialOffer
  } = Global121.Indy

  let password = "shh, secret!"
  let steward = {
    seed: '000000000000000000000000Steward1',
    did: 'did:sov:Th7MpTaRZVRYnPiabds81Y',
    verificationKey: 'FYmoFw55GeQH7SRFa37dkx1d2dZ3zUF8ckg7wmL7ofN4'
  }
  let schema = {
    id: '1',
    name: 'gvt',
    version: '1.0',
    ver: '1.0',
    attrNames: ['age', 'sex', 'height', 'name']
  }

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

  it('creates a schema', async done => {
    try {
      let id = await createSchema(password, anchor.did, schema)
      expect(id).not.toBeNull()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  it('fails creating a schema with insufficient privileges', async done => {
    try {
      let unprivileged = await generateDid(password)
      let id = await createSchema(password, unprivileged.did, schema)
      fail("expected schema creation to fail")
    } catch (error) {
      expect(error).toBeDefined()
    }
    done()
  })

  var credential

  it('creates a credential definition', async done => {
    try {
      credential = await createCredentialDefinition(
        password, anchor.did, schema, 'tag'
      )
      expect(credential.id).toBeDefined()
      expect(credential.definition).toBeDefined()
      done()
    } catch (error) {
      done.fail(error)
    }
  })

  it('creates a credential offer', async done => {
    try {
      let offer = await createCredentialOffer(password, credential.id)
      expect(offer).toBeDefined()
      done()
    } catch(error) {
      done.fail()
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

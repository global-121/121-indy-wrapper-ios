exports.defineAutoTests = function () {

  let {
    setup,
    createWallet,
    createMasterSecret,
    deleteWallet,
    generateDid,
  } = Global121.Indy

  let password = "shh, secret!"

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
      let did = await generateDid(password)
      expect(did).toContain('did:sov:')
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

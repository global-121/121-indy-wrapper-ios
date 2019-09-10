exports.defineAutoTests = function () {

  let password = "shh, secret!"

  setupTest = async done => {
    let result = await Global121.Indy.setup()
    expect(result).toBeNull()
    done()
  }

  it('performs setup', setupTest)
  it('can perform setup more than once', setupTest)

  it('can create a wallet', async done => {
    let result = await Global121.Indy.createWallet(password)
    expect(result).toBeNull()
    done()
  })

  it('throws when wallet was already created', async done => {
    try {
      await Global121.Indy.createWallet(password)
      fail("expected wallet creation to fail")
    } catch (error) {
      expect(error).toBeDefined()
    }
    done()
  })

  it('generates a DID', async done => {
    Global121.Indy.generateDid(password,
      (did, verificationKey) => {
        expect(did).toContain('did:sov:')
        expect(verificationKey).not.toBeNull()
        done()
      },
      error => {
        fail(error)
        done()
      }
    )
  })

  it('fails generating a DID when password is incorrect', done => {
    Global121.Indy.generateDid("wrong password",
      result => {
        fail("expected DID generation to fail")
        done()
      },
      error => {
        expect(error).toBeDefined()
        done()
      }
    )
  })

  it('can delete a wallet', async done => {
    let result = await Global121.Indy.deleteWallet(password)
    expect(result).toBeNull()
    done()
  })
}

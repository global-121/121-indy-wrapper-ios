exports.defineAutoTests = function () {

  let password = "shh, secret!"

  setupTest = done => {
    Global121.Indy.setup(
      result => {
        expect(result).toBeNull()
        done()
      },
      error => {
        fail(error)
        done()
      }
    )
  }

  it('performs setup', setupTest)
  it('can perform setup more than once', setupTest)

  it('can create a wallet', done => {
    Global121.Indy.createWallet(password,
      result => {
        expect(result).toBeNull()
        done()
      },
      error => {
        fail(error)
        done()
      }
    )
  })

  it('throws when wallet was already created', done => {
    Global121.Indy.createWallet(password,
      result => {
        fail("expected wallet creation to fail")
        done()
      },
      error => {
        expect(error).toBeDefined()
        done()
      }
    )
  })

  it('opens and closes wallet', done => {
    Global121.Indy.openWallet(
      password,
      handle => {
        expect(handle).toBeDefined()
        Global121.Indy.closeWallet(handle)
        done()
      },
      msg => {
        fail('Got an error: ' + msg)
        done()
      }
    )
  })

  it('generates a DID', done => {
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

  it('can delete a wallet', done => {
    Global121.Indy.deleteWallet(password,
      result => {
        expect(result).toBeNull()
        done()
      },
      error => {
        fail(error)
        done()
      }
    )
  })
}

exports.defineAutoTests = function () {

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

  it('opens and closes wallet', done => {
    Global121.Indy.openWallet(
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
}

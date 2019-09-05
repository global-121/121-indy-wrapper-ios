exports.defineAutoTests = function () {
  it('opens and closes wallet', done => {
    Global121.Indy.openWallet(
      null,
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

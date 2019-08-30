exports.defineAutoTests = function () {
  it('returns error code from Indy framework', done => {
    Global121.Indy.openWallet(
      null,
      msg => {
        expect(msg).toBe('wallet open')
        done()
      },
      msg => {
        fail('Got an error: ' + msg)
        done()
      }
    )
  })
}

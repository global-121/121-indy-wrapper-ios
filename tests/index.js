exports.defineAutoTests = function () {
  it('returns error code from Indy framework', done => {
    Global121.Indy.createWallet(null, null, msg => {
      expect(msg).toBe('Error code: 101')
      done()
    })
  })
}

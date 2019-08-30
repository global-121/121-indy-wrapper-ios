exports.defineAutoTests = function () {
  it('has a createWallet function', () => {
    expect(Global121.Indy.createWallet).toBeDefined()
  })

  it('errors when calling createWallet', done => {
    Global121.Indy.createWallet(null, null, msg => {
      expect(msg).toBe('not implemented yet')
      done()
    })
  })
}

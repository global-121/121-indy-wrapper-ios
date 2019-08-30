exports.defineAutoTests = function () {
  it('has a createWallet function', () => {
    expect(Global121.Indy.createWallet).toBeDefined()
  })
}

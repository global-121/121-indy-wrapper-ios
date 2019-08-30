@objc(Global121Indy) class Global121Indy: CDVPlugin {
  @objc(createWallet:)
  func createWallet(command: CDVInvokedUrlCommand) {
    let pluginResult = CDVPluginResult(
      status: CDVCommandStatus_ERROR,
      messageAs: "not implemented yet"
    )
    self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
  }
}

import Indy

// Uncomment the following line when editing this using Xcode
//import Cordova

@objc(Global121Indy) class Global121Indy: CDVPlugin {
  @objc(createWallet:)
  func createWallet(command: CDVInvokedUrlCommand) {
    IndyWallet.sharedInstance()?.createWallet(
        withConfig: "",
        credentials: "") { error in
            let pluginResult: CDVPluginResult
            if let error = error as NSError? {
                pluginResult = CDVPluginResult(
                    status: CDVCommandStatus_ERROR,
                    messageAs: "Error code: \(error.code)")
            } else {
                pluginResult = CDVPluginResult(status: CDVCommandStatus_OK)
            }
            self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
    }
  }
}

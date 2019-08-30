import Indy

// Uncomment the following line when editing this using Xcode
//import Cordova

@objc class Global121Indy: CDVPlugin {
    @objc func openWallet(_ command: CDVInvokedUrlCommand) {
        let documentsDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let walletsDir = documentsDir.appendingPathComponent("global-121-wallets", isDirectory: true)
        if !FileManager.default.fileExists(atPath: walletsDir.path) {
            try! FileManager.default.createDirectory(at: walletsDir, withIntermediateDirectories: false)
        }
        let config = ["id": "wallet", "storage_config": ["path": walletsDir.path]] as [String : Any]
        let configJSONdata = try! JSONSerialization.data(withJSONObject: config)
        let configJSON = String(data: configJSONdata, encoding: .utf8)

        let credentials = ["key": "welcome123"]
        let credentialsJSONdata = try! JSONSerialization.data(withJSONObject: credentials)
        let credentialsJSON = String(data: credentialsJSONdata, encoding: .utf8)

        let openWallet = {
            IndyWallet.sharedInstance()?.open(
                withConfig: configJSON,
                credentials: credentialsJSON) { error, walletHandle in
                    if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                        self.commandDelegate!.send(result(error: error),
                                                   callbackId: command.callbackId)
                        return
                    }
                    print("wallet open")
                    self.commandDelegate!.send(
                        CDVPluginResult(status: CDVCommandStatus_OK,
                                        messageAs: "wallet open"),
                        callbackId: command.callbackId)
            }
        }

        let createWallet = {
            IndyWallet.sharedInstance()?.createWallet(
                withConfig: configJSON,
                credentials: credentialsJSON) { error in
                    if let error = error as NSError?,
                        error.code != IndyErrorCode.Success.rawValue,
                        error.code != IndyErrorCode.WalletAlreadyExistsError.rawValue {
                        self.commandDelegate!.send(result(error: error),
                                                   callbackId: command.callbackId)
                        return
                    }
                    print("wallet available")
                    openWallet()
            }
        }

        let createPool = {
            let poolConfigPath = Bundle.main.path(
                forResource: "sovrin_pool_transactions_sandbox_genesis",
                ofType: "txt")!
            let config = ["genesis_txn": poolConfigPath]
            let configJSONdata = try! JSONSerialization.data(withJSONObject: config)
            let configJSON = String(data: configJSONdata, encoding: .utf8)

            let poolName = "pool"
            IndyPool.createPoolLedgerConfig(
                withPoolName: poolName,
                poolConfig: configJSON) { error in

                    if let error = error as NSError? {
                        if error.code != IndyErrorCode.Success.rawValue
                            && error.code != IndyErrorCode.PoolLedgerConfigAlreadyExistsError.rawValue {
                            self.commandDelegate!.send(result(error: error),
                                                       callbackId: command.callbackId)
                            return
                        }
                    }

                    print("pool available")

                    IndyPool.openLedger(withName: poolName, poolConfig: configJSON) { error, poolHandle in
                        if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                            self.commandDelegate!.send(result(error: error),
                                                       callbackId: command.callbackId)
                            return
                        }

                        print("pool open")
                        createWallet()
                    }
            }
        }

        IndyPool.setProtocolVersion(2) { error in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.commandDelegate!.send(result(error: error),
                                           callbackId: command.callbackId)
            }
            else {
                createPool()
            }
        }
    }
}

func result(error: NSError) -> CDVPluginResult {
    return CDVPluginResult(
        status: CDVCommandStatus_ERROR,
        messageAs: "Error code: \(error.code)")
}

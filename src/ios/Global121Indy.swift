import Indy

// Uncomment the following line when editing this using Xcode
//import Cordova

let poolName = "pool"

@objc class Global121Indy: CDVPlugin {

    var _poolConfigJSON: String?
    var poolConfigJSON: String? {
        if _poolConfigJSON == nil {
            let poolConfigPath = Bundle.main.path(
                forResource: "sovrin_pool_transactions_sandbox_genesis",
                ofType: "txt")!
            let config = ["genesis_txn": poolConfigPath]
            let configJSONdata = try! JSONSerialization.data(withJSONObject: config)
            _poolConfigJSON = String(data: configJSONdata, encoding: .utf8)
        }
        return _poolConfigJSON
    }

    var _walletConfigJSON: String?
    var walletConfigJSON: String? {
        if _walletConfigJSON == nil {
            let documentsDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
            let walletsDir = documentsDir.appendingPathComponent("global-121-wallets", isDirectory: true)
            if !FileManager.default.fileExists(atPath: walletsDir.path) {
                try! FileManager.default.createDirectory(at: walletsDir, withIntermediateDirectories: false)
            }
            let config = ["id": "wallet", "storage_config": ["path": walletsDir.path]] as [String : Any]
            let configJSONdata = try! JSONSerialization.data(withJSONObject: config)
            _walletConfigJSON = String(data: configJSONdata, encoding: .utf8)
        }
        return _walletConfigJSON
    }

    var _credentialsJSON: String?
    var credentialsJSON: String? {
        if _credentialsJSON == nil {
            let credentials = ["key": "welcome123"]
            let credentialsJSONdata = try! JSONSerialization.data(withJSONObject: credentials)
            _credentialsJSON = String(data: credentialsJSONdata, encoding: .utf8)
        }
        return _credentialsJSON
    }


    @objc func openWallet(_ command: CDVInvokedUrlCommand) {
        setProtocolVersion() { error in
            if let error = error as NSError? {
                self.send(error: error, for: command)
                return
            }

            self.createPool { error in
                if let error = error as NSError? {
                    self.send(error: error, for: command)
                    return
                }

                print("pool available")
                self.openLedger{ (_, error) in
                    if let error = error as NSError? {
                        self.send(error: error, for: command)
                        return
                    }

                    print("pool open")
                    self.createWallet { error in
                        if let error = error as NSError? {
                            self.send(error: error, for: command)
                            return
                        }

                        print("wallet available")
                        self.openTheWallet { _, error in
                            if let e = error as NSError? {
                                self.send(error: e, for: command)
                                return
                            }

                            print("wallet open")
                            self.commandDelegate!.send(
                                CDVPluginResult(status: CDVCommandStatus_OK,
                                                messageAs: "wallet open"),
                                callbackId: command.callbackId)
                        }
                    }
                }
            }
        }
    }

    private func setProtocolVersion(completion: @escaping (Error?)->Void) {
        IndyPool.setProtocolVersion(2) { error in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                completion(error)
            }
            else {
                completion(nil)
            }
        }
    }

    private func createPool(completion: @escaping (Error?)->Void) {
        IndyPool.createPoolLedgerConfig(
            withPoolName: poolName,
            poolConfig: self.poolConfigJSON) { error in
                if let error = error as NSError?,
                    error.code != IndyErrorCode.Success.rawValue,
                    error.code != IndyErrorCode.PoolLedgerConfigAlreadyExistsError.rawValue {
                    completion(error)
                }
                else {
                    completion(nil)
                }
        }
    }

    private func openLedger(completion: @escaping (IndyHandle?, Error?)->Void) {
        IndyPool.openLedger(withName: poolName, poolConfig: self.poolConfigJSON) { error, poolHandle in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                completion(nil, error)
            }
            else {
                completion(poolHandle, nil)
            }
        }
    }

    private func createWallet(completion: @escaping (Error?)->Void) {
        IndyWallet.sharedInstance()?.createWallet(
            withConfig: self.walletConfigJSON,
            credentials: self.credentialsJSON) { error in
                if let error = error as NSError?,
                    error.code != IndyErrorCode.Success.rawValue,
                    error.code != IndyErrorCode.WalletAlreadyExistsError.rawValue {
                    completion(error)
                }
                else {
                    completion(nil)
                }
        }
    }

    private func openTheWallet(completion: @escaping (IndyHandle?, Error?)->Void) {
        IndyWallet.sharedInstance()?.open(
            withConfig: self.walletConfigJSON,
            credentials: self.credentialsJSON) { error, walletHandle in
                if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                    completion(nil, error)
                    return
                }
                completion(walletHandle, nil)
        }
    }

    private func send(error: NSError, for command: CDVInvokedUrlCommand) {
        self.commandDelegate!.send(result(error: error),
                                   callbackId: command.callbackId)

    }
}

func result(error: NSError) -> CDVPluginResult {
    return CDVPluginResult(
        status: CDVCommandStatus_ERROR,
        messageAs: "Error code: \(error.code)")
}

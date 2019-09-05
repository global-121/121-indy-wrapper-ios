import Indy

#if canImport(Cordova)
import Cordova
#endif

let poolName = "pool"

@objc class Global121Indy: CDVPlugin {

    var setupDone = false

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

    @objc func setup(_ command: CDVInvokedUrlCommand) {
        guard !setupDone else {
            sendOk(for: command)
            return
        }

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

                self.openLedger{ (_, error) in
                    if let error = error as NSError? {
                        self.send(error: error, for: command)
                        return
                    }
                    self.setupDone = true
                    self.sendOk(for: command)
                }
            }
        }
    }

    @objc func createWallet(_ command: CDVInvokedUrlCommand) {
        let password = command.arguments[0] as! String
        self.createWallet(password: password) { error in
            if let error = error as NSError? {
                self.send(error: error, for: command)
                return
            }
            self.sendOk(for: command)
        }
    }

    @objc func deleteWallet(_ command: CDVInvokedUrlCommand) {
        let password = command.arguments[0] as! String
        self.deleteWallet(password: password) { error in
            if let error = error as NSError? {
                self.send(error: error, for: command)
                return
            }
            self.sendOk(for: command)
        }
    }

    @objc func openWallet(_ command: CDVInvokedUrlCommand) {
        let password = command.arguments[0] as! String
        self.openWallet(password: password) { handle, error in
            if let e = error as NSError? {
                self.send(error: e, for: command)
                return
            }

            self.commandDelegate!.send(
                CDVPluginResult(status: CDVCommandStatus_OK,
                                messageAs: handle!),
                callbackId: command.callbackId)
        }
    }

    @objc func closeWallet(_ command: CDVInvokedUrlCommand) {
        let handle = command.arguments[0] as! IndyHandle
        IndyWallet.sharedInstance().close(withHandle: handle) { error in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.sendOk(for: command)
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

    private func createWallet(password: String, completion: @escaping (Error?)->Void) {
        IndyWallet.sharedInstance()?.createWallet(
            withConfig: self.walletConfigJSON,
            credentials: credentials(password: password)) { error in
                if let error = error as NSError?,
                    error.code != IndyErrorCode.Success.rawValue {
                    completion(error)
                }
                else {
                    completion(nil)
                }
        }
    }

    private func deleteWallet(password: String, completion: @escaping (Error?)->Void) {
        IndyWallet.sharedInstance()?.delete(
            withConfig: self.walletConfigJSON,
            credentials: credentials(password: password)) { error in
                if let error = error as NSError?,
                    error.code != IndyErrorCode.Success.rawValue {
                    completion(error)
                }
                else {
                    completion(nil)
                }
        }
    }

    private func openWallet(password: String, completion: @escaping (IndyHandle?, Error?)->Void) {
        IndyWallet.sharedInstance()?.open(
            withConfig: self.walletConfigJSON,
            credentials: credentials(password: password)) { error, walletHandle in
                if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                    completion(nil, error)
                    return
                }
                completion(walletHandle, nil)
        }
    }

    private func sendOk(for command: CDVInvokedUrlCommand) {
        self.commandDelegate!.send(CDVPluginResult(status: CDVCommandStatus_OK),
                                   callbackId: command.callbackId)

    }

    private func send(error: NSError, for command: CDVInvokedUrlCommand) {
        self.commandDelegate!.send(result(error: error),
                                   callbackId: command.callbackId)

    }
}

func credentials(password: String) -> String {
    let credentials = ["key": password]
    let credentialsJSONdata = try! JSONSerialization.data(withJSONObject: credentials)
    return String(data: credentialsJSONdata, encoding: .utf8)!
}

func result(error: NSError) -> CDVPluginResult {
    return CDVPluginResult(
        status: CDVCommandStatus_ERROR,
        messageAs: "Error code: \(error.code)")
}

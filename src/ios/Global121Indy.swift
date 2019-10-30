import Indy

#if canImport(Cordova)
import Cordova
#endif

let poolName = "pool"

@objc class Global121Indy: CDVPlugin {

    var setupDone = false
    var poolHandle: IndyHandle?

    lazy var poolConfigJSON = PoolConfig.test121

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

                self.openLedger{ (handle, error) in
                    if let error = error as NSError? {
                        self.send(error: error, for: command)
                        return
                    }
                    self.poolHandle = handle
                    self.setupDone = true
                    self.sendOk(for: command)
                }
            }
        }
    }

    @objc func createWallet(_ command: CDVInvokedUrlCommand) {
        guard let password = command.arguments[0] as? String else {
            return sendInvalidArgument(for: command)
        }
        self.createWallet(password: password) { error in
            if let error = error as NSError? {
                return self.send(error: error, for: command)
            }
            self.sendOk(for: command)
        }
    }

    @objc func createMasterSecret(_ command: CDVInvokedUrlCommand) {
        guard let wallet = command.arguments[0] as? IndyHandle else {
            return sendInvalidArgument(for: command)
        }
        IndyAnoncreds.proverCreateMasterSecret("secret", walletHandle: wallet) { error, id in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: id!),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func deleteWallet(_ command: CDVInvokedUrlCommand) {
        guard let password = command.arguments[0] as? String else {
            return sendInvalidArgument(for: command)
        }
        self.deleteWallet(password: password) { error in
            if let error = error as NSError? {
                self.send(error: error, for: command)
                return
            }
            self.sendOk(for: command)
        }
    }

    @objc func openWallet(_ command: CDVInvokedUrlCommand) {
        guard let password = command.arguments[0] as? String else {
            return sendInvalidArgument(for: command)
        }
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
        guard let handle = command.arguments[0] as? IndyHandle else {
            return sendInvalidArgument(for: command)
        }
        IndyWallet.sharedInstance().close(withHandle: handle) { error in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.sendOk(for: command)
            }
        }
    }

    @objc func generateDid(_ command: CDVInvokedUrlCommand) {
        guard let wallet = command.arguments[0] as? IndyHandle else {
            return sendInvalidArgument(for: command)
        }
        let seed = command.arguments[1] as? String
        let json = seed == nil ? "{}" : "{ \"seed\": \"\(seed!)\" }"
        IndyDid.createAndStoreMyDid(json, walletHandle: wallet) { error, did, verificationKey in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: [did!, verificationKey!]),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func buildTrustAnchorRequest(_ command: CDVInvokedUrlCommand) {
        guard let submitterDid = command.arguments[0] as? String,
            let anchorDid = command.arguments[1] as? String,
            let anchorVerificationKey = command.arguments[2] as? String else {
               return sendInvalidArgument(for: command)
        }

        IndyLedger.buildNymRequest(
            withSubmitterDid: submitterDid,
            targetDID: anchorDid,
            verkey: anchorVerificationKey,
            alias: nil,
            role: "TRUST_ANCHOR"
        ) { error, request in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: request),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func createSchema(_ command: CDVInvokedUrlCommand) {
        guard let did = command.arguments[0] as? String,
            let name = command.arguments[1] as? String,
            let version = command.arguments[2] as? String,
            let attributes = command.arguments[3] as? String else {
                return sendInvalidArgument(for: command)
        }
        IndyAnoncreds.issuerCreateSchema(
            withName: name,
            version: version,
            attrs: attributes,
            issuerDID: did
        ) { error, id, json in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: [id!, json!]),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func buildSchemaRequest(_ command: CDVInvokedUrlCommand) {
        guard let did = command.arguments[0] as? String,
            let schema = command.arguments[1] as? String else {
                return sendInvalidArgument(for: command)
        }
        IndyLedger.buildSchemaRequest(withSubmitterDid: did, data: schema) { error, request in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: request),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func buildGetSchemaRequest(_ command: CDVInvokedUrlCommand) {
        guard let id = command.arguments[0] as? String else {
            return sendInvalidArgument(for: command)
        }
        IndyLedger.buildGetSchemaRequest(withSubmitterDid: nil, id: id) { error, request in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: request!),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func parseGetSchemaResponse(_ command: CDVInvokedUrlCommand) {
        guard let response = command.arguments[0] as? String else {
            return sendInvalidArgument(for: command)
        }
        IndyLedger.parseGetSchemaResponse(response) { error, id, json in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: [id!, json!]),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func signAndSubmitRequest(_ command: CDVInvokedUrlCommand) {
        guard let pool = self.poolHandle else {
            self.send(error: Global121Error.poolHandleMissing, for: command)
            return
        }
        guard let wallet = command.arguments[0] as? IndyHandle,
            let did = command.arguments[1] as? String,
            let request = command.arguments[2] as? String else {
                return sendInvalidArgument(for: command)
        }
        IndyLedger.signAndSubmitRequest(
            request,
            submitterDID: did,
            poolHandle: pool,
            walletHandle: wallet
        ) { error, response in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: response),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func createCredentialDefinition(_ command: CDVInvokedUrlCommand) {
        guard let wallet = command.arguments[0] as? IndyHandle,
            let did = command.arguments[1] as? String,
            let schema = command.arguments[2] as? String,
            let tag = command.arguments[3] as? String else {
            return sendInvalidArgument(for: command)
        }
        IndyAnoncreds.issuerCreateAndStoreCredentialDef(
            forSchema: schema,
            issuerDID: did,
            tag: tag,
            type: nil,
            configJSON: nil,
            walletHandle: wallet
        ) { error, id, json in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: [id!, json!]),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func buildCredentialDefinitionRequest(_ command: CDVInvokedUrlCommand) {
        guard let did = command.arguments[0] as? String,
            let definition = command.arguments[1] as? String else {
                return sendInvalidArgument(for: command)
        }
        IndyLedger.buildCredDefRequest(withSubmitterDid: did, data: definition) { error, request in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: request!),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func buildGetCredentialDefinitionRequest(_ command: CDVInvokedUrlCommand) {
        guard let id = command.arguments[0] as? String else {
            return sendInvalidArgument(for: command)
        }
        IndyLedger.buildGetCredDefRequest(withSubmitterDid: nil, id: id) { error, request in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: request!),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func submitRequest(_ command: CDVInvokedUrlCommand) {
        guard let pool = self.poolHandle else {
            self.send(error: Global121Error.poolHandleMissing, for: command)
            return
        }
        guard let request = command.arguments[0] as? String else {
            return sendInvalidArgument(for: command)
        }
        IndyLedger.submitRequest(request, poolHandle: pool) { error, response in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: response!),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func parseGetCredentialDefinitionResponse(_ command: CDVInvokedUrlCommand) {
        guard let response = command.arguments[0] as? String else {
            return sendInvalidArgument(for: command)
        }
        IndyLedger.parseGetCredDefResponse(response) { error, id, json in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: [id!, json!]),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func createCredentialOffer(_ command: CDVInvokedUrlCommand) {
        guard let wallet = command.arguments[0] as? IndyHandle,
            let credentialDefinitionId = command.arguments[1] as? String else {
                return sendInvalidArgument(for: command)
        }
        IndyAnoncreds.issuerCreateCredentialOffer(
            forCredDefId: credentialDefinitionId,
            walletHandle: wallet
        ) { error, offer in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: offer),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func createCredentialRequest(_ command: CDVInvokedUrlCommand) {
        guard let wallet = command.arguments[0] as? IndyHandle,
            let did = command.arguments[1] as? String,
            let offer = command.arguments[2] as? String,
            let definition = command.arguments[3] as? String else {
                return sendInvalidArgument(for: command)
        }
        IndyAnoncreds.proverCreateCredentialReq(
            forCredentialOffer: offer,
            credentialDefJSON: definition,
            proverDID: did,
            masterSecretID: "secret",
            walletHandle: wallet
        ) { error, json, meta in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: [json!, meta!]),
                    callbackId: command.callbackId)
            }
        }

    }

    @objc func createCredential(_ command: CDVInvokedUrlCommand) {
        guard let wallet = command.arguments[0] as? IndyHandle,
            let offer = command.arguments[1] as? String,
            let request = command.arguments[2] as? String,
            let values = command.arguments[3] as? String else {
                return sendInvalidArgument(for: command)
        }
        IndyAnoncreds.issuerCreateCredential(
            forCredentialRequest: request,
            credOfferJSON: offer,
            credValuesJSON: values,
            revRegId: nil,
            blobStorageReaderHandle: nil,
            walletHandle: wallet
        ) { error, json, _, _ in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: json!),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func storeCredential(_ command: CDVInvokedUrlCommand) {
        guard let wallet = command.arguments[0] as? IndyHandle,
            let definition = command.arguments[1] as? String,
            let requestMeta = command.arguments[2] as? String,
            let credential = command.arguments[3] as? String else {
                return sendInvalidArgument(for: command)
        }
        IndyAnoncreds.proverStoreCredential(
            credential,
            credID: nil,
            credReqMetadataJSON: requestMeta,
            credDefJSON: definition,
            revRegDefJSON: nil,
            walletHandle: wallet
        ) { error, id in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: id!),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func getCredentialsForProofRequest(_ command: CDVInvokedUrlCommand) {
        guard let wallet = command.arguments[0] as? IndyHandle,
            let proofRequest = command.arguments[1] as? String else {
                return sendInvalidArgument(for: command)
        }
        IndyAnoncreds.proverGetCredentials(
            forProofReq: proofRequest,
            walletHandle: wallet
        ) { error, json in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: json!),
                    callbackId: command.callbackId)
            }
        }
    }

    @objc func createProof(_ command: CDVInvokedUrlCommand) {
        guard let wallet = command.arguments[0] as? IndyHandle,
            let proofRequest = command.arguments[1] as? String,
            let requestedCredentials = command.arguments[2] as? String,
            let schemas = command.arguments[3] as? String,
            let credentialDefinitions = command.arguments[4] as? String else {
                return sendInvalidArgument(for: command)
        }
        IndyAnoncreds.proverCreateProof(
            forRequest: proofRequest,
            requestedCredentialsJSON: requestedCredentials,
            masterSecretID: "secret",
            schemasJSON: schemas,
            credentialDefsJSON: credentialDefinitions,
            revocStatesJSON: "{}",
            walletHandle: wallet
        ) { error, proof in
            if let error = error as NSError?, error.code != IndyErrorCode.Success.rawValue {
                self.send(error: error as NSError, for: command)
            } else {
                self.commandDelegate?.send(
                    CDVPluginResult(status: CDVCommandStatus_OK,
                                    messageAs: proof!),
                    callbackId: command.callbackId)
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
        self.commandDelegate?.send(CDVPluginResult(status: CDVCommandStatus_OK),
                                   callbackId: command.callbackId)

    }

    private func send(error: NSError, for command: CDVInvokedUrlCommand) {
        self.commandDelegate?.send(result(error: error),
                                   callbackId: command.callbackId)

    }

    private func send(error: Global121Error, for command: CDVInvokedUrlCommand) {
        self.commandDelegate?.send(result(error: error),
                                   callbackId: command.callbackId)

    }

    private func sendInvalidArgument(for command: CDVInvokedUrlCommand) {
        send(error: Global121Error.invalidArgument, for: command)
    }
}

enum Global121Error: String, Error {
    case poolHandleMissing = "Ledger was not opened, did you call setup?"
    case invalidArgument = "Missing or invalid argument(s)"
}

func credentials(password: String) -> String {
    let credentials = ["key": password]
    let credentialsJSONdata = try! JSONSerialization.data(withJSONObject: credentials)
    return String(data: credentialsJSONdata, encoding: .utf8)!
}

func result(error: Global121Error) -> CDVPluginResult {
    return CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.rawValue)
}

func result(error: NSError) -> CDVPluginResult {
    if let message = error.userInfo["message"] {
        return CDVPluginResult(
            status: CDVCommandStatus_ERROR,
            messageAs: "Error code: \(error.code), \(message)")
    } else {
        return CDVPluginResult(
            status: CDVCommandStatus_ERROR,
            messageAs: "Error code: \(error.code)")
    }
}

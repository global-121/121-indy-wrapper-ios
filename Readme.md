Cordova plugin 121 Indy
=======================

A [Cordova](https://cordova.apache.org) plugin that wraps [Hyperledger Indy](https://www.hyperledger.org/projects/hyperledger-indy) functionality.

Currently supported platforms:
* iOS (13+)


## Installation

Add the plugin to your Cordova project:

```bash
cordova plugin add https://github.com/global-121/121-indy-wrapper-ios.git#0.2.0
```

Where `#0.2.0` can be replaced by a specific [tag/release version](https://github.com/global-121/121-indy-wrapper-ios/releases).


## Usage

All API functions are available on the `Global121.Indy` object. For instance,
the `setup` function can be referenced as follows:

```javascript
const { setup } = Global121.Indy
```

Ensure that the plugin is set up properly:

```javascript
await setup()
```

Create the wallet. This needs to be called only once:

```javascript
let password = 'shh, secret!'
await createWallet({ password })
```

Create a master secret (needed for zero knowledge proofs).
Like most API calls this requires the wallet password.

```javascript
await createMasterSecret({ password })
```

Generate a new DID (Decentralized Identity):

```javascript
let { did, verificationKey } = await generateDid({ password })
```

Create a credential request:

```javascript
let { json, meta } = await createCredentialRequest({
  password, did, credentialOffer, credentialDefinitionId
})
```

Store a credential:

```javascript
let id = await storeCredential({
  password, definition, requestMeta, credential
})
```

Create a proof:

```javascript
let proof = await createProof({ password, proofRequest })
```


### Asynchronous calls

The API calls are all asynchronous, and they support both callbacks and
promises. So you can use the async/await syntax from the examples above, but
also the older syntax where you supply success and error callbacks:

```javascript
setup(
  function(result) { /* handle success */ },
  function(error) { /* handle error */ }
)
```


## Testing

See the [iOS Test-App](https://github.com/global-121/121-indy-wrapper-ios-testapp) for running the plugin tests on iOS.

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).

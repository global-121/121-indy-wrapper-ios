struct PoolConfig {
    static let local = readConfig("docker_pool_transactions_genesis")
    static let sovrinSandbox = readConfig("sovrin_pool_transactions_sandbox_genesis")
}

private func readConfig(_ filename: String) -> String {
    let path = Bundle.main.path(forResource: filename, ofType: "txt")!
    let config = ["genesis_txn": path]
    let json = try! JSONSerialization.data(withJSONObject: config)
    return String(data: json, encoding: .utf8)!
}


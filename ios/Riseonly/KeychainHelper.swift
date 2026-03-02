//
//  KeychainHelper.swift
//  Riseonly
//
//  Helper for managing auth token in Keychain with App Group support
//  This is used by the main app to save tokens that extensions can access
//

import Foundation
import Security

@objc(KeychainHelper)
class KeychainHelper: NSObject {
    static let shared = KeychainHelper()
    
    private let service = "com.nics51.rn-frontend"
    private let accessGroup = "group.com.nics51.riseonly"
    
    private override init() {
        super.init()
    }
    
    // MARK: - Save Token
    
    @objc func saveAuthToken(_ token: String) -> Bool {
        guard let data = token.data(using: .utf8) else {
            return false
        }
        
        // First, try to delete existing token
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "authToken",
            kSecAttrAccessGroup as String: accessGroup
        ]
        SecItemDelete(deleteQuery as CFDictionary)
        
        // Now add the new token
        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "authToken",
            kSecAttrAccessGroup as String: accessGroup,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]
        
        let status = SecItemAdd(addQuery as CFDictionary, nil)
        let success = status == errSecSuccess
        
        if success {
            print("✅ Auth token saved to Keychain with App Group access")
        } else {
            print("❌ Failed to save auth token to Keychain: \(status)")
        }
        
        return success
    }
    
    // MARK: - Get Token
    
    @objc func getAuthToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "authToken",
            kSecAttrAccessGroup as String: accessGroup,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            print("❌ Failed to retrieve auth token from Keychain: \(status)")
            return nil
        }
        
        print("✅ Auth token retrieved from Keychain")
        return token
    }
    
    // MARK: - Delete Token
    
    @objc func deleteAuthToken() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "authToken",
            kSecAttrAccessGroup as String: accessGroup
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        let success = status == errSecSuccess || status == errSecItemNotFound
        
        if success {
            print("✅ Auth token deleted from Keychain")
        } else {
            print("❌ Failed to delete auth token from Keychain: \(status)")
        }
        
        return success
    }
}


//
//  KeychainBridge.swift
//  Riseonly
//
//  React Native bridge implementation for KeychainHelper
//

import Foundation
import React

@objc(KeychainBridge)
class KeychainBridge: NSObject {
    
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc func saveAuthToken(_ token: String,
                            resolver resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
        let success = KeychainHelper.shared.saveAuthToken(token)
        if success {
            resolve(true)
        } else {
            reject("KEYCHAIN_ERROR", "Failed to save auth token", nil)
        }
    }
    
    @objc func getAuthToken(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
        if let token = KeychainHelper.shared.getAuthToken() {
            resolve(token)
        } else {
            resolve(NSNull())
        }
    }
    
    @objc func deleteAuthToken(_ resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        let success = KeychainHelper.shared.deleteAuthToken()
        if success {
            resolve(true)
        } else {
            reject("KEYCHAIN_ERROR", "Failed to delete auth token", nil)
        }
    }
}


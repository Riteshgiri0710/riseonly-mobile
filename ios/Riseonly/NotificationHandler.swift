//
//  NotificationHandler.swift
//  Riseonly
//
//  Handles notification interactions and deep linking
//

import Foundation
import UserNotifications
import React

@objc(NotificationHandler)
class NotificationHandler: RCTEventEmitter {
    
    private var hasListeners = false
    
    private static var sharedInstance: NotificationHandler?
    
    static var shared: NotificationHandler {
        if let instance = sharedInstance {
            return instance
        }
        // Fallback: create temporary instance (should not happen in normal flow)
        let temp = NotificationHandler()
        sharedInstance = temp
        return temp
    }
    
    override init() {
        super.init()
        NotificationHandler.sharedInstance = self
        print("✅ NotificationHandler initialized")
    }
    
    @objc override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func supportedEvents() -> [String]! {
        return ["onNotificationTapped", "onNotificationReceived", "onNotificationReply", "onNotificationMarkAsRead"]
    }
    
    override func startObserving() {
        hasListeners = true
        print("✅ NotificationHandler: Listeners started (hasListeners = true)")
    }
    
    override func stopObserving() {
        hasListeners = false
        print("⚠️ NotificationHandler: Listeners stopped (hasListeners = false)")
    }
    
    private func sanitizeForBridge(_ value: Any) -> Any? {
        switch value {
        case is NSNull:
            return NSNull()
        case let str as String:
            return str
        case let num as NSNumber:
            return num
        case let arr as [Any]:
            return arr.compactMap { sanitizeForBridge($0) }
        case let dict as [AnyHashable: Any]:
            var out: [String: Any] = [:]
            for (k, v) in dict {
                guard let key = k as? String else { continue }
                if let sanitized = sanitizeForBridge(v) {
                    out[key] = sanitized
                }
            }
            return out
        case let url as URL:
            return url.absoluteString
        case let date as Date:
            return ISO8601DateFormatter().string(from: date)
        default:
            return String(describing: value)
        }
    }
    
    private func bodyFromUserInfo(_ userInfo: [AnyHashable: Any]) -> [String: Any] {
        guard let sanitized = sanitizeForBridge(userInfo) as? [String: Any] else {
            return [:]
        }
        return jsonSafeBody(sanitized) ?? [:]
    }
    
    private func jsonSafeBody(_ dict: [String: Any]) -> [String: Any]? {
        guard JSONSerialization.isValidJSONObject(dict),
              let data = try? JSONSerialization.data(withJSONObject: dict),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return [:]
        }
        return obj
    }
    
    @objc func handleNotificationTap(_ userInfo: [AnyHashable: Any]) {
        print("🔔 handleNotificationTap called, hasListeners: \(hasListeners)")
        print("📤 Sending onNotificationTapped event")
        let body = bodyFromUserInfo(userInfo)
        NotificationHandlerBridge.sendEvent(withName: "onNotificationTapped", body: body, emitter: self)
    }
    
    @objc func handleNotificationReceived(_ userInfo: [AnyHashable: Any]) {
        print("📱 handleNotificationReceived called, hasListeners: \(hasListeners)")
        print("📤 Sending onNotificationReceived event")
        let body = bodyFromUserInfo(userInfo)
        NotificationHandlerBridge.sendEvent(withName: "onNotificationReceived", body: body, emitter: self)
    }
    
    @objc func handleNotificationReply(_ userInfo: [AnyHashable: Any], messageText: String) {
        print("💬 handleNotificationReply called, hasListeners: \(hasListeners), message: \(messageText)")
        var eventData = bodyFromUserInfo(userInfo)
        eventData["reply_text"] = messageText
        let body = jsonSafeBody(eventData) ?? eventData
        print("📤 Sending onNotificationReply event")
        NotificationHandlerBridge.sendEvent(withName: "onNotificationReply", body: body, emitter: self)
    }
    
    @objc func handleNotificationMarkAsRead(_ userInfo: [AnyHashable: Any]) {
        print("✅ handleNotificationMarkAsRead called, hasListeners: \(hasListeners)")
        print("📤 Sending onNotificationMarkAsRead event")
        let body = bodyFromUserInfo(userInfo)
        NotificationHandlerBridge.sendEvent(withName: "onNotificationMarkAsRead", body: body, emitter: self)
    }
}


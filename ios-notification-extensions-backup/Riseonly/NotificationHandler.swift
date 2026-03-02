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
    
    @objc func handleNotificationTap(_ userInfo: [AnyHashable: Any]) {
        print("🔔 handleNotificationTap called, hasListeners: \(hasListeners)")
        // Always try to send event - React Native may subscribe later
        // The event will be queued if no listeners yet
        print("📤 Sending onNotificationTapped event")
        sendEvent(withName: "onNotificationTapped", body: userInfo)
    }
    
    @objc func handleNotificationReceived(_ userInfo: [AnyHashable: Any]) {
        print("📱 handleNotificationReceived called, hasListeners: \(hasListeners)")
        // Always try to send event
        print("📤 Sending onNotificationReceived event")
        sendEvent(withName: "onNotificationReceived", body: userInfo)
    }
    
    @objc func handleNotificationReply(_ userInfo: [AnyHashable: Any], messageText: String) {
        print("💬 handleNotificationReply called, hasListeners: \(hasListeners), message: \(messageText)")
        var eventData: [String: Any] = [:]
        for (key, value) in userInfo {
            if let keyString = key as? String {
                eventData[keyString] = value
            }
        }
        eventData["reply_text"] = messageText
        print("📤 Sending onNotificationReply event")
        sendEvent(withName: "onNotificationReply", body: eventData)
    }
    
    @objc func handleNotificationMarkAsRead(_ userInfo: [AnyHashable: Any]) {
        print("✅ handleNotificationMarkAsRead called, hasListeners: \(hasListeners)")
        print("📤 Sending onNotificationMarkAsRead event")
        sendEvent(withName: "onNotificationMarkAsRead", body: userInfo)
    }
}


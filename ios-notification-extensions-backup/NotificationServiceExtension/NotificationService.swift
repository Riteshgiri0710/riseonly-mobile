//
//  NotificationService.swift
//  NotificationServiceExtension
//
//  Created by Дулат Аянов on 16.10.2025.
//

import UserNotifications
import UIKit
import Intents

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    var originalRequest: UNNotificationRequest?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        self.originalRequest = request
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        guard let bestAttemptContent = bestAttemptContent else {
            contentHandler(request.content)
            return
        }
        
        let userInfo = request.content.userInfo
        
        let notificationType = userInfo["type"] as? String ?? ""
        
        switch notificationType {
        case "new_message":
            handleMessageNotification(bestAttemptContent, userInfo: userInfo, originalRequest: request)
        default:
            handleGenericNotification(bestAttemptContent, userInfo: userInfo)
        }
    }
    
    private func handleMessageNotification(_ content: UNMutableNotificationContent, userInfo: [AnyHashable: Any], originalRequest: UNNotificationRequest) {
        let chatId = userInfo["chat_id"] as? String ?? ""
        let messageId = userInfo["message_id"] as? String ?? ""
        let senderId = userInfo["sender_id"] as? String ?? ""
        let senderName = userInfo["sender_name"] as? String ?? ""
        let avatarUrl = userInfo["avatar_url"] as? String
        let mediaUrl = userInfo["media_url"] as? String
        let mediaType = userInfo["media_type"] as? String
        
        print("📦 NotificationService: Processing message notification")
        print("   chatId: \(chatId)")
        print("   messageId: \(messageId)")
        print("   senderId: \(senderId)")
        print("   senderName: \(senderName)")
        print("   avatarUrl: \(avatarUrl ?? "nil")")
        print("   mediaUrl: \(mediaUrl ?? "nil")")
        print("   mediaType: \(mediaType ?? "nil")")
        print("   📝 Content from request:")
        print("      Title: '\(content.title)'")
        print("      Body: '\(content.body)'")
        print("      Body isEmpty: \(content.body.isEmpty)")
        print("      Body count: \(content.body.count)")
        
        // Check if body is empty - this should never happen if backend sends it correctly
        if content.body.isEmpty {
            print("⚠️ WARNING: Notification body is EMPTY! This will result in blank notification.")
            print("   This usually means the backend didn't send the message text in aps.alert.body")
        }
        
        content.threadIdentifier = chatId
        
        content.categoryIdentifier = "MESSAGE_CATEGORY"
        
        content.userInfo = userInfo
        
        if let avatarUrl = avatarUrl, !avatarUrl.isEmpty {
            setupCommunicationNotification(
                content: content,
                senderId: senderId,
                senderName: senderName,
                avatarUrl: avatarUrl,
                mediaUrl: mediaUrl,
                originalRequest: originalRequest
            )
        } else {
            // No avatar, but maybe we have media
            if let mediaUrl = mediaUrl, !mediaUrl.isEmpty {
                attachMediaItem(mediaUrl: mediaUrl, to: content)
            } else {
                deliverNotification(content)
            }
        }
    }
    
    private func setupCommunicationNotification(content: UNMutableNotificationContent, senderId: String, senderName: String, avatarUrl: String, mediaUrl: String?, originalRequest: UNNotificationRequest) {
        // CRITICAL: Save original body and title BEFORE any modifications
        let originalBody = content.body
        let originalTitle = content.title
        
        print("📝 Original notification content:")
        print("   Title: '\(originalTitle)'")
        print("   Body: '\(originalBody)'")
        print("   Body isEmpty: \(originalBody.isEmpty)")
        
        APIClient.shared.downloadImage(from: avatarUrl) { [weak self] imageData in
            guard let self = self else { return }
            
            var personImage: INImage?
            if let imageData = imageData {
                personImage = INImage(imageData: imageData)
            }
            
            let personHandle = INPersonHandle(value: senderId, type: .unknown)
            
            let sender = INPerson(
                personHandle: personHandle,
                nameComponents: nil,
                displayName: senderName.isEmpty ? "User" : senderName,
                image: personImage,
                contactIdentifier: nil,
                customIdentifier: "riseonly_\(senderId)"
            )
            
            // Use original body for intent - this is what iOS will display
            let messageContent = originalBody.isEmpty ? "New message" : originalBody
            print("📨 Creating intent with content: '\(messageContent)'")
            
            let intent = INSendMessageIntent(
                recipients: nil,
                outgoingMessageType: .outgoingMessageText,
                content: messageContent,
                speakableGroupName: nil,
                conversationIdentifier: content.threadIdentifier,
                serviceName: nil,
                sender: sender,
                attachments: nil
            )
            
            let interaction = INInteraction(intent: intent, response: nil)
            interaction.direction = .incoming
            interaction.donate { error in
                if let error = error {
                    print("⚠️ Failed to donate interaction: \(error.localizedDescription)")
                } else {
                    print("✅ Successfully donated interaction")
                }
            }
            
            do {
                let originalContent = originalRequest.content
                let updatedContent = try originalContent.updating(from: intent)
                
                guard let mutableUpdated = updatedContent.mutableCopy() as? UNMutableNotificationContent else {
                    throw NSError(domain: "NotificationService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to create mutable content"])
                }
                
                mutableUpdated.threadIdentifier = content.threadIdentifier
                mutableUpdated.categoryIdentifier = content.categoryIdentifier
                mutableUpdated.userInfo = content.userInfo
                
                // CRITICAL: Always restore original body and title after updating from intent
                // iOS may clear or modify these during updating(from:), so we must restore them
                if !originalTitle.isEmpty {
                    mutableUpdated.title = originalTitle
                } else if !senderName.isEmpty {
                    mutableUpdated.title = senderName
                }
                
                // This is the most important part - ensure body is always set
                if !originalBody.isEmpty {
                    mutableUpdated.body = originalBody
                    print("✅ Restored body after intent update: '\(originalBody)'")
                } else {
                    // Fallback if body is empty
                    mutableUpdated.body = messageContent
                    print("⚠️ Original body was empty, using intent content: '\(messageContent)'")
                }
                
                print("📋 Final notification content:")
                print("   Title: '\(mutableUpdated.title)'")
                print("   Body: '\(mutableUpdated.body)'")
                print("   Body isEmpty: \(mutableUpdated.body.isEmpty)")
                
                print("✅ Successfully set up Communication Notification with avatar")
                print("📎 Attachments after updating from intent: \(mutableUpdated.attachments.count)")
                for (index, att) in mutableUpdated.attachments.enumerated() {
                    print("   Attachment \(index) after update: identifier=\(att.identifier)")
                }
                
                // If we have media URL, attach it on the right side
                // Note: We can have both avatar (via Communication Notifications) and media (via attachment)
                // IMPORTANT: For Communication Notifications, attachments must be added AFTER updating from intent
                // to ensure they are preserved in the expanded view
                if let mediaUrl = mediaUrl, !mediaUrl.isEmpty {
                    print("📷 Attaching media item: \(mediaUrl)")
                    self.attachMediaItem(mediaUrl: mediaUrl, to: mutableUpdated)
                } else {
                    print("ℹ️ No media URL provided")
                    self.deliverNotification(mutableUpdated)
                }
            } catch {
                print("⚠️ Failed to update content from intent: \(error.localizedDescription)")
                print("⚠️ Error details: \(error)")
                
                // Fallback: Use composited avatar with app icon badge
                if let imageData = imageData, let avatarImage = UIImage(data: imageData) {
                    // Attach composited avatar first
                    self.attachCompositedAvatar(avatarImage: avatarImage, to: content)
                    
                    // If we have media, also attach it (iOS will show both if possible)
                    if let mediaUrl = mediaUrl, !mediaUrl.isEmpty {
                        // Note: iOS typically shows only one attachment, but we try anyway
                        self.attachMediaItem(mediaUrl: mediaUrl, to: content)
                    }
                } else {
                    // No avatar, but maybe we have media
                    if let mediaUrl = mediaUrl, !mediaUrl.isEmpty {
                        self.attachMediaItem(mediaUrl: mediaUrl, to: content)
                    } else {
                        self.deliverNotification(content)
                    }
                }
            }
        }
    }
    
    private func attachMediaItem(mediaUrl: String, to content: UNMutableNotificationContent) {
        print("📥 Starting media download from: \(mediaUrl)")
        
        // Download media item
        APIClient.shared.downloadImage(from: mediaUrl) { [weak self] imageData in
            guard let self = self else { return }
            
            guard let imageData = imageData else {
                print("⚠️ Failed to download media item from: \(mediaUrl)")
                self.deliverNotification(content)
                return
            }
            
            print("✅ Downloaded media item, size: \(imageData.count) bytes")
            
            // Save media image to temporary directory
            // IMPORTANT: Use temporaryDirectory - iOS will copy the file to its own storage
            // The file must exist when UNNotificationAttachment is created
            let tempDirectory = FileManager.default.temporaryDirectory
            let imageFileName = "media_\(UUID().uuidString).jpg"
            let imageFileURL = tempDirectory.appendingPathComponent(imageFileName)
            
            do {
                // Write image data to file
                try imageData.write(to: imageFileURL)
                
                // Verify file exists and get its size
                let fileAttributes = try FileManager.default.attributesOfItem(atPath: imageFileURL.path)
                let fileSize = fileAttributes[.size] as? Int64 ?? 0
                print("💾 Saved media to: \(imageFileURL.path), size: \(fileSize) bytes")
                
                // Create attachment for media (will appear in expanded notification)
                // iOS will copy the file to its own storage, so the original can be deleted later
                // For Communication Notifications, we need to ensure the attachment is properly configured
                // to show in the expanded view
                var attachmentOptions: [AnyHashable: Any] = [
                    UNNotificationAttachmentOptionsTypeHintKey: "public.jpeg",
                    // Don't hide thumbnail - we want it visible in expanded view
                    UNNotificationAttachmentOptionsThumbnailHiddenKey: false,
                    // Full image clipping for expanded view
                    UNNotificationAttachmentOptionsThumbnailClippingRectKey: CGRect(x: 0, y: 0, width: 1, height: 1)
                ]
                
                let attachment = try UNNotificationAttachment(
                    identifier: "media",
                    url: imageFileURL,
                    options: attachmentOptions
                )
                
                // IMPORTANT: For Communication Notifications, we need to ensure attachments are properly set
                // iOS may not preserve attachments from updating(from:), so we explicitly set them
                var attachments = content.attachments
                
                print("📎 Current attachments before adding media: \(attachments.count)")
                for (index, att) in attachments.enumerated() {
                    print("   Existing attachment \(index): identifier=\(att.identifier)")
                }
                
                // Remove any existing "media" attachment to avoid duplicates
                let beforeCount = attachments.count
                attachments.removeAll { $0.identifier == "media" }
                if attachments.count < beforeCount {
                    print("🗑️ Removed existing media attachment")
                }
                
                // Add media attachment - it should appear in expanded view
                attachments.append(attachment)
                content.attachments = attachments
                
                print("✅ Successfully attached media item (identifier: media), total attachments: \(content.attachments.count)")
                for (index, att) in content.attachments.enumerated() {
                    print("   Attachment \(index): identifier=\(att.identifier), URL=\(att.url)")
                    // Verify attachment file exists
                    if FileManager.default.fileExists(atPath: att.url.path) {
                        let attSize = (try? FileManager.default.attributesOfItem(atPath: att.url.path)[.size] as? Int64) ?? 0
                        print("      ✅ File exists, size: \(attSize) bytes")
                    } else {
                        print("      ❌ File does NOT exist at path: \(att.url.path)")
                    }
                }
                
                // Verify the attachment is actually in the content
                if content.attachments.contains(where: { $0.identifier == "media" }) {
                    print("✅ Media attachment confirmed in content.attachments")
                    
                    // Final verification before delivery
                    print("📦 Final check before delivery:")
                    print("   Total attachments: \(content.attachments.count)")
                    for (index, att) in content.attachments.enumerated() {
                        print("   Final attachment \(index): identifier=\(att.identifier), URL=\(att.url)")
                        if att.identifier == "media" {
                            // Verify file is accessible
                            if FileManager.default.fileExists(atPath: att.url.path) {
                                print("      ✅ Media file exists and is accessible")
                            } else {
                                print("      ⚠️ Media file path exists but file may have been moved by iOS")
                            }
                        }
                    }
                } else {
                    print("❌ ERROR: Media attachment NOT found in content.attachments after setting!")
                }
            } catch {
                print("❌ Error creating media attachment: \(error.localizedDescription)")
                print("   Error details: \(error)")
            }
            
            // Deliver notification with media attachment
            // The attachment should be available in NotificationContentExtension
            self.deliverNotification(content)
        }
    }
    
    private func attachCompositedAvatar(avatarImage: UIImage, to content: UNMutableNotificationContent) {
        guard let appIcon = getAppIcon() else {
            print("⚠️ Could not load app icon for composition")
            deliverNotification(content)
            return
        }
        
        guard let compositedImage = compositeAvatarWithAppIcon(avatarImage: avatarImage, appIcon: appIcon) else {
            print("⚠️ Failed to composite avatar with app icon")
            deliverNotification(content)
            return
        }
        
        let tempDirectory = FileManager.default.temporaryDirectory
        let imageFileName = "\(UUID().uuidString).jpg"
        let imageFileURL = tempDirectory.appendingPathComponent(imageFileName)
        
        do {
            if let jpegData = compositedImage.jpegData(compressionQuality: 0.9) {
                try jpegData.write(to: imageFileURL)
                
                let attachment = try UNNotificationAttachment(
                    identifier: "avatar",
                    url: imageFileURL,
                    options: [
                        UNNotificationAttachmentOptionsTypeHintKey: "public.jpeg"
                    ]
                )
                
                content.attachments = [attachment]
                print("✅ Attached composited avatar (fallback method)")
            }
        } catch {
            print("❌ Error creating composited attachment: \(error.localizedDescription)")
        }
        
        deliverNotification(content)
    }
    
    private func compositeAvatarWithAppIcon(avatarImage: UIImage, appIcon: UIImage) -> UIImage? {
        let size = CGSize(width: 1024, height: 1024)
        
        UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        guard let context = UIGraphicsGetCurrentContext() else {
            return nil
        }
        
        let avatarRect = CGRect(origin: .zero, size: size)
        avatarImage.draw(in: avatarRect)
        
        let badgeSize: CGFloat = size.width * 0.28
        let badgePadding: CGFloat = size.width * 0.05
        
        let badgeRect = CGRect(
            x: size.width - badgeSize - badgePadding,
            y: size.height - badgeSize - badgePadding,
            width: badgeSize,
            height: badgeSize
        )
        
        context.saveGState()
        
        context.setShadow(
            offset: CGSize(width: 0, height: 2),
            blur: 6,
            color: UIColor.black.withAlphaComponent(0.25).cgColor
        )
        context.setFillColor(UIColor.white.cgColor)
        context.fillEllipse(in: badgeRect)
        
        context.restoreGState()
        
        let iconPadding: CGFloat = badgeSize * 0.15
        let iconRect = badgeRect.insetBy(dx: iconPadding, dy: iconPadding)
        appIcon.draw(in: iconRect)
        
        return UIGraphicsGetImageFromCurrentImageContext()
    }
    
    private func getAppIcon() -> UIImage? {
        let extensionBundleID = Bundle.main.bundleIdentifier ?? ""
        let mainAppBundleID = extensionBundleID.replacingOccurrences(of: ".NotificationServiceExtension", with: "")
        
        if let mainAppBundle = Bundle(identifier: mainAppBundleID) {
            if let icons = mainAppBundle.object(forInfoDictionaryKey: "CFBundleIcons") as? [String: Any],
               let primaryIcon = icons["CFBundlePrimaryIcon"] as? [String: Any],
               let iconFiles = primaryIcon["CFBundleIconFiles"] as? [String] {
                for iconName in iconFiles.reversed() {
                    if let iconImage = UIImage(named: iconName, in: mainAppBundle, compatibleWith: nil) {
                        return iconImage
                    }
                    for ext in ["png", "jpg", "jpeg"] {
                        if let iconPath = mainAppBundle.path(forResource: iconName, ofType: ext),
                           let iconImage = UIImage(contentsOfFile: iconPath) {
                            return iconImage
                        }
                    }
                }
            }
        }
        
        let extensionPath = Bundle.main.bundlePath
        if extensionPath.contains(".appex") {
            let mainAppPath = (extensionPath as NSString).deletingLastPathComponent
                .replacingOccurrences(of: "/PlugIns", with: "")
            
            if let mainAppBundle = Bundle(path: mainAppPath) {
                if let icons = mainAppBundle.object(forInfoDictionaryKey: "CFBundleIcons") as? [String: Any],
                   let primaryIcon = icons["CFBundlePrimaryIcon"] as? [String: Any],
                   let iconFiles = primaryIcon["CFBundleIconFiles"] as? [String] {
                    for iconName in iconFiles.reversed() {
                        for ext in ["png", "jpg", "jpeg"] {
                            if let iconPath = mainAppBundle.path(forResource: iconName, ofType: ext),
                               let iconImage = UIImage(contentsOfFile: iconPath) {
                                return iconImage
                            }
                        }
                    }
                }
            }
        }
        
        return nil
    }
    
    private func attachImageAsFallback(imageData: Data, to content: UNMutableNotificationContent) {
        let tempDirectory = FileManager.default.temporaryDirectory
        let imageFileName = "\(UUID().uuidString).jpg"
        let imageFileURL = tempDirectory.appendingPathComponent(imageFileName)
        
        do {
            try imageData.write(to: imageFileURL)
            
            let attachment = try UNNotificationAttachment(
                identifier: "avatar",
                url: imageFileURL,
                options: [
                    UNNotificationAttachmentOptionsTypeHintKey: "public.jpeg"
                ]
            )
            
            content.attachments = [attachment]
            print("✅ Attached avatar as fallback (right side)")
        } catch {
            print("❌ Error creating attachment: \(error.localizedDescription)")
        }
        
        deliverNotification(content)
    }
    
    private func handleGenericNotification(_ content: UNMutableNotificationContent, userInfo: [AnyHashable: Any]) {
        deliverNotification(content)
    }
    
    
    private func deliverNotification(_ content: UNMutableNotificationContent) {
        guard let contentHandler = contentHandler else { return }
        
        // Final safety check: ensure body is never empty
        if content.body.isEmpty {
            print("⚠️ CRITICAL: Body is empty before delivery! Adding fallback text.")
            // Try to get sender name from title or userInfo
            let fallbackText = content.title.isEmpty ? "New message" : "Message from \(content.title)"
            content.body = fallbackText
            print("   Set fallback body: '\(fallbackText)'")
        }
        
        print("📤 Delivering notification:")
        print("   Title: '\(content.title)'")
        print("   Body: '\(content.body)'")
        print("   Attachments: \(content.attachments.count)")
        
        contentHandler(content)
    }
    
    override func serviceExtensionTimeWillExpire() {
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }

}

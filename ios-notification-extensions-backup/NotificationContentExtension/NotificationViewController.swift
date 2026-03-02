//
//  NotificationViewController.swift
//  NotificationContentExtension
//
//  Created by Дулат Аянов on 16.10.2025.
//

import UIKit
import UserNotifications
import UserNotificationsUI

class NotificationViewController: UIViewController, UNNotificationContentExtension {
    private var messageLabelTopConstraint: NSLayoutConstraint?
    private var messageLabelMediaTopConstraint: NSLayoutConstraint?
    
    private let avatarImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 20
        imageView.backgroundColor = .systemGray5
        return imageView
    }()
    
    private let senderNameLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 16, weight: .semibold)
        label.textColor = .label
        return label
    }()
    
    private let messageLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 15, weight: .regular)
        label.textColor = .label
        label.numberOfLines = 0
        return label
    }()
    
    private let timeLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 13, weight: .regular)
        label.textColor = .secondaryLabel
        return label
    }()
    
    private let mediaImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFit
        imageView.clipsToBounds = true
        imageView.backgroundColor = .systemGray6
        imageView.layer.cornerRadius = 0
        return imageView
    }()
    
    private let mediaTypeLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = .systemFont(ofSize: 13, weight: .medium)
        label.textColor = .secondaryLabel
        return label
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Add subviews
        view.addSubview(avatarImageView)
        view.addSubview(senderNameLabel)
        view.addSubview(timeLabel)
        view.addSubview(mediaTypeLabel)
        view.addSubview(messageLabel)
        view.addSubview(mediaImageView)
        
        // Setup constraints
        NSLayoutConstraint.activate([
            // Avatar
            avatarImageView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            avatarImageView.topAnchor.constraint(equalTo: view.topAnchor, constant: 16),
            avatarImageView.widthAnchor.constraint(equalToConstant: 40),
            avatarImageView.heightAnchor.constraint(equalToConstant: 40),
            
            // Sender name
            senderNameLabel.leadingAnchor.constraint(equalTo: avatarImageView.trailingAnchor, constant: 12),
            senderNameLabel.topAnchor.constraint(equalTo: view.topAnchor, constant: 16),
            senderNameLabel.trailingAnchor.constraint(equalTo: timeLabel.leadingAnchor, constant: -8),
            
            // Time
            timeLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            timeLabel.centerYAnchor.constraint(equalTo: senderNameLabel.centerYAnchor),
            
            // Media type label (next to sender name)
            mediaTypeLabel.leadingAnchor.constraint(equalTo: senderNameLabel.trailingAnchor, constant: 8),
            mediaTypeLabel.centerYAnchor.constraint(equalTo: senderNameLabel.centerYAnchor),
            mediaTypeLabel.trailingAnchor.constraint(lessThanOrEqualTo: timeLabel.leadingAnchor, constant: -8),
            
            // Media image (large, below header - takes most of the space)
            mediaImageView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 0),
            mediaImageView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: 0),
            mediaImageView.topAnchor.constraint(equalTo: avatarImageView.bottomAnchor, constant: 16),
            // Large height for full-screen effect in expanded notification
            mediaImageView.heightAnchor.constraint(equalToConstant: 500),
            
            // Message (below media - will be updated dynamically)
            messageLabel.leadingAnchor.constraint(equalTo: avatarImageView.trailingAnchor, constant: 12),
            messageLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            messageLabel.bottomAnchor.constraint(lessThanOrEqualTo: view.bottomAnchor, constant: -16)
        ])
        
        // Dynamic constraint for message (below sender name when no media)
        messageLabelTopConstraint = messageLabel.topAnchor.constraint(equalTo: senderNameLabel.bottomAnchor, constant: 4)
        messageLabelTopConstraint?.isActive = true
        
        // Constraint for message below media (will be activated when media is present)
        messageLabelMediaTopConstraint = messageLabel.topAnchor.constraint(equalTo: mediaImageView.bottomAnchor, constant: 12)
        
        // Initially hide media
        mediaImageView.isHidden = true
        mediaTypeLabel.isHidden = true
    }
    
    func didReceive(_ notification: UNNotification) {
        let content = notification.request.content
        let userInfo = content.userInfo
        
        print("📱 NotificationContentExtension: didReceive called")
        print("   Category: \(content.categoryIdentifier)")
        print("   Thread: \(content.threadIdentifier)")
        print("   Title: \(content.title)")
        print("   Body: \(content.body)")
        print("   Total attachments: \(content.attachments.count)")
        
        // Set sender name (from title)
        senderNameLabel.text = content.title
        
        // Set message body
        messageLabel.text = content.body
        
        // Set time
        let dateFormatter = DateFormatter()
        dateFormatter.timeStyle = .short
        timeLabel.text = dateFormatter.string(from: notification.date)
        
        let chatType = (userInfo["chat_type"] as? String) ?? "PRIVATE"
        let chatId = userInfo["chat_id"] as? String
        let chatTitle = (userInfo["chat_title"] as? String) ?? content.title
        let useGroupChannelAvatar = (chatType == "GROUP" || chatType == "CHANNEL") && (chatId != nil && !(chatId ?? "").isEmpty)

        if useGroupChannelAvatar, let cid = chatId {
            avatarImageView.image = createChatLogoAvatar(chatId: cid, chatType: chatType, title: chatTitle)
                ?? createDefaultAvatar(name: chatTitle)
        } else {
            var avatarLoaded = false
            for attachment in content.attachments {
                if attachment.identifier == "avatar" {
                    print("👤 Found avatar attachment")
                    loadAvatar(from: attachment.url)
                    avatarLoaded = true
                    break
                }
            }
            if !avatarLoaded {
                avatarImageView.image = createDefaultAvatar(name: content.title)
            }
        }
        
        print("🔍 Checking attachments for media: \(content.attachments.count) total")
        for (index, attachment) in content.attachments.enumerated() {
            print("   Attachment \(index): identifier=\(attachment.identifier), URL=\(attachment.url)")
            if FileManager.default.fileExists(atPath: attachment.url.path) {
                print("      ✅ File exists at path")
            } else {
                print("      ⚠️ File does not exist at path (may have been moved by iOS)")
            }
        }
        
        var mediaLoaded = false
        for attachment in content.attachments {
            if attachment.identifier == "media" {
                print("📷 Found media attachment, loading from: \(attachment.url)")
                loadMedia(from: attachment.url)
                mediaLoaded = true
                
                if let mediaType = userInfo["media_type"] as? String {
                    mediaTypeLabel.text = getMediaTypeLabel(for: mediaType)
                    mediaTypeLabel.isHidden = false
                    print("📝 Media type: \(mediaType)")
                } else {
                    print("⚠️ No media_type in userInfo")
                }
                break
            }
        }
        
        if !mediaLoaded {
            print("ℹ️ No media attachment found")
            mediaImageView.isHidden = true
            mediaTypeLabel.isHidden = true
            messageLabelMediaTopConstraint?.isActive = false
            messageLabelTopConstraint?.isActive = true
        } else {
            print("✅ Media loaded successfully")
            mediaImageView.isHidden = false
            messageLabelTopConstraint?.isActive = false
            messageLabelMediaTopConstraint?.isActive = true
        }
    }
    
    private func loadMedia(from url: URL) {
        print("📥 Loading media from URL: \(url.path)")
        
        let fileManager = FileManager.default
        if !fileManager.fileExists(atPath: url.path) {
            print("❌ Media file does NOT exist at path: \(url.path)")
            print("   Attempting to access via URL: \(url)")
        } else {
            if let attributes = try? fileManager.attributesOfItem(atPath: url.path),
               let fileSize = attributes[.size] as? Int64 {
                print("✅ Media file exists, size: \(fileSize) bytes")
            }
        }
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            do {
                let data = try Data(contentsOf: url)
                print("✅ Loaded \(data.count) bytes from media file")
                
                guard let image = UIImage(data: data) else {
                    print("❌ Failed to create UIImage from data")
                    DispatchQueue.main.async {
                        self?.mediaImageView.isHidden = true
                    }
                    return
                }
                
                print("✅ Created UIImage, size: \(image.size)")
                
                DispatchQueue.main.async {
                    self?.mediaImageView.image = image
                    self?.mediaImageView.isHidden = false
                    // Force layout update
                    self?.view.setNeedsLayout()
                    self?.view.layoutIfNeeded()
                    print("✅ Media image displayed in notification, imageView frame: \(self?.mediaImageView.frame ?? .zero)")
                }
            } catch {
                print("❌ Error loading media: \(error.localizedDescription)")
                print("   Error details: \(error)")
                // Try alternative approach - check if it's a security-scoped resource
                if url.startAccessingSecurityScopedResource() {
                    defer { url.stopAccessingSecurityScopedResource() }
                    if let data = try? Data(contentsOf: url),
                       let image = UIImage(data: data) {
                        print("✅ Loaded media using security-scoped resource")
                        DispatchQueue.main.async {
                            self?.mediaImageView.image = image
                            self?.mediaImageView.isHidden = false
                            self?.view.setNeedsLayout()
                            self?.view.layoutIfNeeded()
                        }
                        return
                    }
                }
                
                DispatchQueue.main.async {
                    self?.mediaImageView.isHidden = true
                }
            }
        }
    }
    
    private func getMediaTypeLabel(for mediaType: String) -> String {
        switch mediaType.lowercased() {
        case "photo", "image":
            return "📷 Фотография"
        case "video":
            return "🎥 Видео"
        case "audio", "voice":
            return "🎵 Аудио"
        case "document", "file":
            return "📄 Файл"
        default:
            return "📎 Медиа"
        }
    }
    
    private func loadAvatar(from url: URL) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let data = try? Data(contentsOf: url),
                  let image = UIImage(data: data) else {
                DispatchQueue.main.async {
                    self?.avatarImageView.image = self?.createDefaultAvatar(name: "?")
                }
                return
            }
            
            DispatchQueue.main.async {
                self?.avatarImageView.image = image
            }
        }
    }
    
    private func createDefaultAvatar(name: String) -> UIImage? {
        let size = CGSize(width: 40, height: 40)
        let renderer = UIGraphicsImageRenderer(size: size)
        
        let image = renderer.image { context in
            UIColor.systemBlue.setFill()
            context.cgContext.fillEllipse(in: CGRect(origin: .zero, size: size))
            
            let initial = String(name.prefix(1)).uppercased()
            let safeInitial = initial.isEmpty ? "?" : initial
            let attributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 18, weight: .semibold),
                .foregroundColor: UIColor.white
            ]
            
            let textSize = safeInitial.size(withAttributes: attributes)
            let textRect = CGRect(
                x: (size.width - textSize.width) / 2,
                y: (size.height - textSize.height) / 2,
                width: textSize.width,
                height: textSize.height
            )
            
            safeInitial.draw(in: textRect, withAttributes: attributes)
        }
        
        return image
    }
    
    private func createChatLogoAvatar(chatId: String, chatType: String, title: String) -> UIImage? {
        guard let color = getUserColorInChat(chatType: chatType, chatId: chatId, userId: "none") else { return nil }
        
        let size = CGSize(width: 40, height: 40)
        let renderer = UIGraphicsImageRenderer(size: size)
        
        let image = renderer.image { context in
            color.setFill()
            context.cgContext.fillEllipse(in: CGRect(origin: .zero, size: size))
            
            let initial = String(title.prefix(1)).uppercased()
            let safeInitial = initial.isEmpty ? "?" : initial
            let attributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 18, weight: .semibold),
                .foregroundColor: UIColor.white
            ]
            
            let textSize = safeInitial.size(withAttributes: attributes)
            let textRect = CGRect(
                x: (size.width - textSize.width) / 2,
                y: (size.height - textSize.height) / 2,
                width: textSize.width,
                height: textSize.height
            )
            
            safeInitial.draw(in: textRect, withAttributes: attributes)
        }
        
        return image
    }
    
    // MARK: - getUserColorInChat (port from theme/index.tsx)
    
    private static let userColorPalette: [UIColor] = [
        UIColor(red: 255/255, green: 65/255, blue: 65/255, alpha: 1),
        UIColor(red: 255/255, green: 140/255, blue: 0/255, alpha: 1),
        UIColor(red: 255/255, green: 200/255, blue: 0/255, alpha: 1),
        UIColor(red: 200/255, green: 220/255, blue: 0/255, alpha: 1),
        UIColor(red: 100/255, green: 200/255, blue: 100/255, alpha: 1),
        UIColor(red: 0/255, green: 200/255, blue: 150/255, alpha: 1),
        UIColor(red: 0/255, green: 180/255, blue: 220/255, alpha: 1),
        UIColor(red: 50/255, green: 150/255, blue: 255/255, alpha: 1),
        UIColor(red: 100/255, green: 100/255, blue: 255/255, alpha: 1),
        UIColor(red: 150/255, green: 100/255, blue: 255/255, alpha: 1),
        UIColor(red: 200/255, green: 100/255, blue: 255/255, alpha: 1),
        UIColor(red: 255/255, green: 100/255, blue: 200/255, alpha: 1),
        UIColor(red: 255/255, green: 100/255, blue: 150/255, alpha: 1),
        UIColor(red: 200/255, green: 150/255, blue: 100/255, alpha: 1),
        UIColor(red: 150/255, green: 150/255, blue: 150/255, alpha: 1),
        UIColor(red: 100/255, green: 200/255, blue: 200/255, alpha: 1),
    ]
    
    private func simpleHash(_ str: String) -> Int {
        var hash: Int32 = 0
        for char in str.unicodeScalars {
            hash = ((hash << 5) &- hash) &+ Int32(truncatingIfNeeded: char.value)
        }
        return Int(abs(hash))
    }
    
    private func getUserColorInChat(chatType: String, chatId: String?, userId: String) -> UIColor? {
        if chatType == "PRIVATE" { return nil }
        let uid = chatType == "CHANNEL" ? "none" : userId
        let key = "\(chatId ?? ""):\(uid)"
        let h = simpleHash(key)
        let idx = h % Self.userColorPalette.count
        return Self.userColorPalette[idx]
    }
    
    // MARK: - Handle Notification Actions

    func didReceive(_ response: UNNotificationResponse, completionHandler completion: @escaping (UNNotificationContentExtensionResponseOption) -> Void) {
        switch response.actionIdentifier {
        case "REPLY_ACTION":
            if let textResponse = response as? UNTextInputNotificationResponse {
                let messageText = textResponse.userText
                print("💬 Reply from extension: \(messageText)")

                completion(.dismissAndForwardAction)
            } else {
                completion(.dismiss)
            }
            
        case "MARK_READ_ACTION":
            print("✅ Mark as Read from extension")
            completion(.dismissAndForwardAction)
            
        default:
            completion(.dismissAndForwardAction)
        }
    }

}

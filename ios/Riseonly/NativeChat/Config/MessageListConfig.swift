import Foundation

struct MessageListConfig {
    var useHoldItem: Bool = false
    var showAvatar: Bool = true
    var showCheckbox: Bool = true
    var showSwipeToReply: Bool = true
    var showReactions: Bool = true
    var showReplyTo: Bool = true
    var showMedia: Bool = true
    var showTime: Bool = true
    var showUsername: Bool = true
    var showReadStatus: Bool = true
    var simpleMessage: Bool = false

    static let `default` = MessageListConfig()
}

import CoreGraphics

/// Design constants matching RN MessageList and Message components.
enum MessageListConstants {
    /// Horizontal padding of list content (RN: paddingHorizontal replyCircleView).
    static let listPaddingHorizontal: CGFloat = 50
    /// Top padding of list (RN: paddingTop 90).
    static let listPaddingTop: CGFloat = 90
    /// Bottom padding is dynamic (bottomHeight from RN).

    /// Left message: negative margin to align with circle (RN: marginLeft -47).
    static let leftMessageMarginLeft: CGFloat = -47
    /// Space between avatar and content (RN: gap 5).
    static let contentRowGap: CGFloat = 5
    /// Avatar size (RN: 35).
    static let avatarSize: CGFloat = 35
    /// Min height of message row (RN: minHeight 35).
    static let messageRowMinHeight: CGFloat = 35

    /// Right message: negative margin (RN: marginRight -replyCircleView).
    static let rightMessageMarginRight: CGFloat = -50
    /// Right message padding right (RN: paddingRight 5).
    static let rightMessagePaddingRight: CGFloat = 5
    /// Bubble max width (RN: maxWidth 280).
    static let bubbleMaxWidth: CGFloat = 280

    /// Bubble corner radius (RN: 20 for right; left has borderBottomRightRadius 20).
    static let bubbleCornerRadius: CGFloat = 20
    /// Right bubble: topRight, topLeft, bottomLeft = 20 (bottomRight sharp in RN is 0 in our path).

    /// MessageContent: content padding left bubble (RN: paddingHorizontal 10, paddingVertical 6).
    static let contentPaddingHorizontal: CGFloat = 10
    static let contentPaddingVertical: CGFloat = 6
    /// Right bubble inner content (RN RightMessage msgContent: paddingVertical 7, paddingHorizontal 11).
    static let rightBubbleContentPaddingVertical: CGFloat = 7
    static let rightBubbleContentPaddingHorizontal: CGFloat = 11
    /// Text (RN: fontSize 16, lineHeight 21).
    static let messageFontSize: CGFloat = 16
    static let messageLineHeight: CGFloat = 21
    /// Time position (RN MessageContent msgInfo: paddingBottom 4, paddingRight isYou ? 8 : 11).
    static let timeBottom: CGFloat = 4
    static let timeRightMy: CGFloat = 8
    static let timeRightOther: CGFloat = 11

    /// Grouping: margin top first in group / rest (RN: isFirstInGroup ? 3 : 2).
    static let marginTopFirstInGroup: CGFloat = 3
    static let marginTopInGroup: CGFloat = 2

    /// Right bubble inner border (RN: paddingHorizontal 1, paddingTop 1).
    static let rightBubbleInnerPadding: CGFloat = 1
}

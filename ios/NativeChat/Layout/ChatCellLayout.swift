import UIKit

/// Layout result for one message bubble + optional avatar (mirrors RN LeftMessage/RightMessage + MessageContent).
struct ChatCellLayout {
    let cellHeight: CGFloat
    let isMyMessage: Bool
    let showAvatar: Bool
    let isFirstInGroup: Bool

    /// Frame of the bubble (in cell content coordinates, before inversion).
    let bubbleFrame: CGRect
    /// Corner radii: topLeft, topRight, bottomLeft, bottomRight (RN: right has 20,20,20,0 effectively).
    let bubbleRadii: (CGFloat, CGFloat, CGFloat, CGFloat)
    /// Text rect inside bubble (content area with MessageContent padding).
    let textFrame: CGRect
    /// Time label rect (absolute bottom-right area).
    let timeFrame: CGRect
    /// Avatar rect (left side for left message; right message has no avatar in row).
    let avatarFrame: CGRect?

    /// Build layout for a message dict (id, content, isMyMessage, showAvatar, isFirstInGroup, created_at, ...).
    static func calculate(
        for message: [String: Any],
        maxWidth: CGFloat,
        theme: ChatTheme
    ) -> ChatCellLayout {
        let content = (message["content"] as? String) ?? ""
        let isMyMessage = (message["isMyMessage"] as? Bool) ?? false
        let showAvatar = (message["showAvatar"] as? Bool) ?? true
        let isFirstInGroup = (message["isFirstInGroup"] as? Bool) ?? true

        let listWidth = maxWidth - MessageListConstants.listPaddingHorizontal * 2
        let font = UIFont.systemFont(ofSize: MessageListConstants.messageFontSize)
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.lineHeightMultiple = MessageListConstants.messageLineHeight / MessageListConstants.messageFontSize

        let textInsets: UIEdgeInsets
        if isMyMessage {
            textInsets = UIEdgeInsets(
                top: MessageListConstants.rightBubbleContentPaddingVertical,
                left: MessageListConstants.rightBubbleContentPaddingHorizontal,
                bottom: MessageListConstants.rightBubbleContentPaddingVertical + 20,
                right: MessageListConstants.rightBubbleContentPaddingHorizontal
            )
        } else {
            textInsets = UIEdgeInsets(
                top: MessageListConstants.contentPaddingVertical,
                left: MessageListConstants.contentPaddingHorizontal,
                bottom: MessageListConstants.contentPaddingVertical + 20,
                right: MessageListConstants.contentPaddingHorizontal
            )
        }
        let availableTextWidth = min(MessageListConstants.bubbleMaxWidth, listWidth * 0.78) - textInsets.left - textInsets.right

        let textSize = (content as NSString).boundingRect(
            with: CGSize(width: availableTextWidth, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [
                .font: font,
                .paragraphStyle: paragraphStyle
            ],
            context: nil
        ).size

        let bubbleContentW = ceil(textSize.width) + textInsets.left + textInsets.right
        let bubbleContentH = ceil(textSize.height) + textInsets.top + textInsets.bottom
        let bubbleW = min(max(60, bubbleContentW), MessageListConstants.bubbleMaxWidth)
        let bubbleH = bubbleContentH

        let contentRowMinHeight = MessageListConstants.messageRowMinHeight
        let rowHeight = max(contentRowMinHeight, bubbleH)
        let marginTop: CGFloat = isFirstInGroup ? MessageListConstants.marginTopFirstInGroup : MessageListConstants.marginTopInGroup

        var bubbleX: CGFloat
        var avatarFrame: CGRect?
        let gap = MessageListConstants.contentRowGap

        if isMyMessage {
            bubbleX = listWidth - bubbleW - MessageListConstants.rightMessagePaddingRight
        } else {
            bubbleX = showAvatar ? MessageListConstants.avatarSize + gap : 0
            if showAvatar {
                avatarFrame = CGRect(
                    x: 0,
                    y: rowHeight - MessageListConstants.avatarSize,
                    width: MessageListConstants.avatarSize,
                    height: MessageListConstants.avatarSize
                )
            }
        }

        let bubbleY: CGFloat = 0
        let bubbleFrame = CGRect(x: bubbleX, y: bubbleY, width: bubbleW, height: bubbleH)

        let textFrame = CGRect(
            x: bubbleFrame.origin.x + textInsets.left,
            y: bubbleFrame.origin.y + textInsets.top,
            width: ceil(textSize.width),
            height: ceil(textSize.height)
        )

        let timeW: CGFloat = 40
        let timeH: CGFloat = 15
        let timeRight = isMyMessage ? MessageListConstants.timeRightMy : MessageListConstants.timeRightOther
        let timeFrame = CGRect(
            x: bubbleFrame.maxX - timeRight - timeW,
            y: bubbleFrame.maxY - MessageListConstants.timeBottom - timeH,
            width: timeW,
            height: timeH
        )

        let radii: (CGFloat, CGFloat, CGFloat, CGFloat) = isMyMessage
            ? (MessageListConstants.bubbleCornerRadius, MessageListConstants.bubbleCornerRadius, MessageListConstants.bubbleCornerRadius, 0)
            : (0, MessageListConstants.bubbleCornerRadius, MessageListConstants.bubbleCornerRadius, MessageListConstants.bubbleCornerRadius)

        let cellHeight = rowHeight + marginTop

        return ChatCellLayout(
            cellHeight: cellHeight,
            isMyMessage: isMyMessage,
            showAvatar: showAvatar,
            isFirstInGroup: isFirstInGroup,
            bubbleFrame: bubbleFrame,
            bubbleRadii: radii,
            textFrame: textFrame,
            timeFrame: timeFrame,
            avatarFrame: avatarFrame
        )
    }
}

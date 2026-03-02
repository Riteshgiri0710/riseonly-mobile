import UIKit

/// One cell for both left and right messages. Design 1:1 with RN LeftMessage/RightMessage + MessageContent.
final class MessageBubbleCell: UITableViewCell {
    static let reuseId = "MessageBubbleCell"

    private let contentInsetLeft = MessageListConstants.listPaddingHorizontal

    private let bubbleShapeLayer = CAShapeLayer()
    private let gradientLayer = CAGradientLayer()
    private let textLayer = CATextLayer()
    private let timeLayer = CATextLayer()
    private let avatarPlaceholder = UIView()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        backgroundColor = .clear
        selectionStyle = .none

        bubbleShapeLayer.contentsScale = UIScreen.main.scale
        contentView.layer.addSublayer(bubbleShapeLayer)

        gradientLayer.contentsScale = UIScreen.main.scale
        gradientLayer.startPoint = CGPoint(x: 0, y: 0)
        gradientLayer.endPoint = CGPoint(x: 1, y: 1)
        contentView.layer.insertSublayer(gradientLayer, below: bubbleShapeLayer)

        textLayer.contentsScale = UIScreen.main.scale
        textLayer.isWrapped = true
        textLayer.truncationMode = .none
        contentView.layer.addSublayer(textLayer)

        timeLayer.contentsScale = UIScreen.main.scale
        timeLayer.fontSize = 11
        timeLayer.alignmentMode = .right
        contentView.layer.addSublayer(timeLayer)

        avatarPlaceholder.backgroundColor = .tertiarySystemFill
        avatarPlaceholder.layer.cornerRadius = MessageListConstants.avatarSize / 2
        avatarPlaceholder.clipsToBounds = true
        contentView.addSubview(avatarPlaceholder)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    func configure(with message: [String: Any], layout: ChatCellLayout, theme: ChatTheme) {
        CATransaction.begin()
        CATransaction.setDisableActions(true)

        let content = (message["content"] as? String) ?? ""
        let timeStr = formatTime(message["created_at"])
        let isMyMessage = layout.isMyMessage

        let bubbleRect = layout.bubbleFrame.offsetBy(dx: contentInsetLeft, dy: 0)
        let path = UIBezierPath.roundedRect(bubbleRect, cornerRadius: 20, corners: layout.bubbleRadii)
        bubbleShapeLayer.path = path.cgPath
        bubbleShapeLayer.fillColor = nil
        bubbleShapeLayer.strokeColor = nil

        if isMyMessage {
            gradientLayer.isHidden = false
            let gradFrame = layout.bubbleFrame.offsetBy(dx: contentInsetLeft, dy: 0)
            gradientLayer.frame = gradFrame
            gradientLayer.colors = theme.gradientColorsForPrimary().map(\.cgColor)
            gradientLayer.locations = [0, 0.5, 1] as [NSNumber]
            let maskShape = CAShapeLayer()
            maskShape.path = UIBezierPath.roundedRect(CGRect(origin: .zero, size: gradFrame.size), cornerRadius: 20, corners: layout.bubbleRadii).cgPath
            gradientLayer.mask = maskShape
            bubbleShapeLayer.fillColor = nil
        } else {
            gradientLayer.isHidden = true
            bubbleShapeLayer.fillColor = theme.bg_200.cgColor
        }

        textLayer.string = NSAttributedString(string: content, attributes: [
            .font: UIFont.systemFont(ofSize: MessageListConstants.messageFontSize),
            .foregroundColor: (isMyMessage ? theme.textOnPrimary : theme.text_100).cgColor
        ])
        textLayer.frame = layout.textFrame.offsetBy(dx: contentInsetLeft, dy: 0)

        timeLayer.string = timeStr
        timeLayer.foregroundColor = (isMyMessage ? theme.textOnPrimary.withAlphaComponent(0.7) : theme.secondary_100).cgColor
        timeLayer.frame = layout.timeFrame.offsetBy(dx: contentInsetLeft, dy: 0)

        if let af = layout.avatarFrame {
            avatarPlaceholder.isHidden = false
            avatarPlaceholder.frame = af.offsetBy(dx: contentInsetLeft, dy: 0)
            avatarPlaceholder.backgroundColor = theme.bg_200
        } else {
            avatarPlaceholder.isHidden = true
        }

        CATransaction.commit()
    }

    private func formatTime(_ value: Any?) -> String {
        guard let v = value else { return "" }
        let ts: TimeInterval
        if let n = v as? NSNumber { ts = n.doubleValue }
        else if let s = v as? String, let n = Double(s) { ts = n }
        else { return "" }
        let date = Date(timeIntervalSince1970: ts / 1000)
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
}

// MARK: - Rounded rect with different corner radii
private extension UIBezierPath {
    static func roundedRect(_ rect: CGRect, cornerRadius: CGFloat, corners: (CGFloat, CGFloat, CGFloat, CGFloat)) -> UIBezierPath {
        let (tl, tr, bl, br) = corners
        let path = UIBezierPath()
        path.move(to: CGPoint(x: rect.minX + tl, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - tr, y: rect.minY))
        if tr > 0 { path.addArc(withCenter: CGPoint(x: rect.maxX - tr, y: rect.minY + tr), radius: tr, startAngle: -.pi/2, endAngle: 0, clockwise: true) }
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - br))
        if br > 0 { path.addArc(withCenter: CGPoint(x: rect.maxX - br, y: rect.maxY - br), radius: br, startAngle: 0, endAngle: .pi/2, clockwise: true) }
        path.addLine(to: CGPoint(x: rect.minX + bl, y: rect.maxY))
        if bl > 0 { path.addArc(withCenter: CGPoint(x: rect.minX + bl, y: rect.maxY - bl), radius: bl, startAngle: .pi/2, endAngle: .pi, clockwise: true) }
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + tl))
        if tl > 0 { path.addArc(withCenter: CGPoint(x: rect.minX + tl, y: rect.minY + tl), radius: tl, startAngle: .pi, endAngle: -.pi/2, clockwise: true) }
        path.close()
        return path
    }
}

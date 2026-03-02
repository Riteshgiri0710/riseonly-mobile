import UIKit

class SaiContextMenuView: UIView {
    
    // UI Elements
    private let backgroundDimView = UIView()
    private let blurEffectView = UIVisualEffectView(effect: UIBlurEffect(style: .dark))
    private let containerView = UIView() 
    
    private let previewContainer = UIView()
    private let reactionsContainer = UIView()
    private let menuContainer = UIView()
    private let menuStackView = UIStackView()
    
    // Data
    private var options: NSDictionary = [:]
    private var items: [[String: Any]] = []
    private var targetRect: CGRect = .zero
    
    var onSelect: ((String) -> Void)?
    var onDismiss: (() -> Void)?
    
    init(frame: CGRect, options: NSDictionary) {
        super.init(frame: frame)
        self.options = options
        self.items = options["items"] as? [[String: Any]] ?? []
        
        let tx = options["targetX"] as? CGFloat ?? 0
        let ty = options["targetY"] as? CGFloat ?? 0
        let tw = options["targetWidth"] as? CGFloat ?? 0
        let th = options["targetHeight"] as? CGFloat ?? 0
        self.targetRect = CGRect(x: tx, y: ty, width: tw, height: th)
        
        setupViews()
    }
    
    required init?(coder: NSCoder) { fatalError() }
    
    private func setupViews() {
        self.frame = UIScreen.main.bounds
        
        // 1. Dark Backdrop
        backgroundDimView.frame = self.bounds
        backgroundDimView.backgroundColor = UIColor.black.withAlphaComponent(0.8) 
        backgroundDimView.alpha = 0
        addSubview(backgroundDimView)
        
        blurEffectView.frame = self.bounds
        blurEffectView.alpha = 0
        addSubview(blurEffectView)
        
        let tap = UITapGestureRecognizer(target: self, action: #selector(self.dismiss))
        self.addGestureRecognizer(tap)
        
        addSubview(containerView)
        
        setupPreview()
        setupReactions()
        setupMenu()
        
        layoutComponents()
    }
    
    private func setupPreview() {
        let msg = options["message"] as? [String: Any] ?? [:]
        let isMe = msg["isMe"] as? Bool ?? false
        let content = msg["content"] as? String ?? ""
        
        // Use EXACT position of the original message
        previewContainer.frame = targetRect
        previewContainer.backgroundColor = isMe ? UIColor(red: 0.22, green: 0.55, blue: 1.00, alpha: 1.0) : UIColor(white: 0.16, alpha: 1.0)
        previewContainer.layer.cornerRadius = 20
        
        // Shadow (hidden initially)
        previewContainer.layer.shadowColor = UIColor.black.cgColor
        previewContainer.layer.shadowOpacity = 0
        previewContainer.layer.shadowRadius = 25
        previewContainer.layer.shadowOffset = CGSize(width: 0, height: 10)
        
        let label = UILabel()
        label.text = content
        label.numberOfLines = 0
        label.font = .systemFont(ofSize: 17.5)
        label.textColor = .white
        label.frame = previewContainer.bounds.insetBy(dx: 12, dy: 8)
        previewContainer.addSubview(label)
        
        containerView.addSubview(previewContainer)
    }
    
    private func setupReactions() {
        guard options["showReactions"] as? Bool ?? true else { return }
        let reactions = ["❤️", "👍", "🤔", "🤣", "🔥", "😢", "🤯"]
        reactionsContainer.backgroundColor = UIColor(white: 0.18, alpha: 0.98)
        reactionsContainer.layer.cornerRadius = 28
        reactionsContainer.alpha = 0
        
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.distribution = .equalSpacing
        stack.alignment = .center
        for emoji in reactions {
            let btn = UIButton(type: .system)
            btn.setTitle(emoji, for: .normal)
            btn.titleLabel?.font = .systemFont(ofSize: 28)
            btn.addTarget(self, action: #selector(self.reactionAction(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }
        reactionsContainer.addSubview(stack)
        let width = CGFloat(reactions.count * 48 + 24)
        reactionsContainer.frame = CGRect(x: 0, y: 0, width: width, height: 56)
        stack.frame = reactionsContainer.bounds.insetBy(dx: 12, dy: 0)
        containerView.addSubview(reactionsContainer)
    }
    
    private func setupMenu() {
        let menuWidth = options["menuWidth"] as? CGFloat ?? 250
        menuContainer.backgroundColor = UIColor(white: 0.18, alpha: 0.98)
        menuContainer.layer.cornerRadius = 16
        menuContainer.layer.masksToBounds = true
        menuContainer.alpha = 0
        
        menuStackView.axis = .vertical
        for (index, item) in items.enumerated() {
            let btn = UIButton(type: .system)
            let label = item["label"] as? String ?? ""
            let isDestructive = item["isDestructive"] as? Bool ?? false
            let iconName = item["icon"] as? String ?? ""
            
            let btnStack = UIStackView()
            btnStack.axis = .horizontal
            btnStack.spacing = 10
            btnStack.alignment = .center
            btnStack.isUserInteractionEnabled = false
            
            let lbl = UILabel()
            lbl.text = label
            lbl.textColor = isDestructive ? .systemRed : .white
            lbl.font = .systemFont(ofSize: 18)
            
            let img = UIImageView(image: UIImage(systemName: mapIcon(iconName)))
            img.tintColor = lbl.textColor
            img.contentMode = .scaleAspectFit
            
            btnStack.addArrangedSubview(lbl)
            btnStack.addArrangedSubview(img)
            
            btn.addSubview(btnStack)
            btnStack.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                btnStack.leadingAnchor.constraint(equalTo: btn.leadingAnchor, constant: 16),
                btnStack.trailingAnchor.constraint(equalTo: btn.trailingAnchor, constant: -16),
                btnStack.centerYAnchor.constraint(equalTo: btn.centerYAnchor)
            ])
            
            btn.tag = index
            btn.addTarget(self, action: #selector(self.menuAction(_:)), for: .touchUpInside)
            menuStackView.addArrangedSubview(btn)
            btn.heightAnchor.constraint(equalToConstant: 48).isActive = true
            
            if index < items.count - 1 {
                let s = UIView()
                s.backgroundColor = UIColor(white: 1, alpha: 0.1)
                menuStackView.addArrangedSubview(s)
                s.heightAnchor.constraint(equalToConstant: 0.5).isActive = true
            }
        }
        menuContainer.addSubview(menuStackView)
        let height = CGFloat(items.count * 48 + (items.count - 1))
        menuContainer.frame = CGRect(x: 0, y: 0, width: menuWidth, height: height)
        menuStackView.frame = menuContainer.bounds
        containerView.addSubview(menuContainer)
    }
    
    private func mapIcon(_ name: String) -> String {
        switch name {
        case "reply": return "arrowshape.turn.up.left"
        case "copy": return "doc.on.doc"
        case "forward": return "arrowshape.turn.up.right"
        case "pin": return "pin"
        case "delete": return "trash"
        case "edit": return "pencil"
        default: return "ellipsis.circle"
        }
    }
    
    private func layoutComponents() {
        let sw = self.bounds.width
        let sh = self.bounds.height
        let safeTop = self.safeAreaInsets.top > 0 ? self.safeAreaInsets.top : 44
        let safeBottom = self.safeAreaInsets.bottom > 0 ? self.safeAreaInsets.bottom : 34
        
        let horizontalPos = options["horizontalPosition"] as? String ?? "left"
        let previewFrame = targetRect
        
        var mX = previewFrame.minX
        if horizontalPos == "right" { mX = previewFrame.maxX - menuContainer.frame.width }
        mX = max(16, min(sw - menuContainer.frame.width - 16, mX))
        
        var rX = previewFrame.minX
        if horizontalPos == "right" { rX = previewFrame.maxX - reactionsContainer.frame.width }
        rX = max(16, min(sw - reactionsContainer.frame.width - 16, rX))
        
        var rY = previewFrame.minY - 70
        var mY = previewFrame.maxY + 15
        
        // Final preview frame (popped)
        var finalPreviewFrame = previewFrame
        
        if mY + menuContainer.frame.height > sh - safeBottom - 20 {
            let shift = (mY + menuContainer.frame.height) - (sh - safeBottom - 20)
            finalPreviewFrame.origin.y -= shift
            rY -= shift
            mY -= shift
        }
        
        if rY < safeTop + 10 {
            let shift = (safeTop + 10) - rY
            finalPreviewFrame.origin.y += shift
            rY += shift
            mY += shift
        }
        
        reactionsContainer.frame.origin = CGPoint(x: rX, y: rY)
        menuContainer.frame.origin = CGPoint(x: mX, y: mY)
        
        // Store the animated target frame for the preview
        self.previewContainer.accessibilityFrame = finalPreviewFrame // Hack to store it
    }
    
    @objc private func reactionAction(_ sender: UIButton) { onSelect?("reaction_\(sender.title(for: .normal) ?? "")") }
    @objc private func menuAction(_ sender: UIButton) { onSelect?(items[sender.tag]["id"] as? String ?? "") }
    
    func present() {
        let haptic = UIImpactFeedbackGenerator(style: .heavy)
        haptic.impactOccurred()
        
        let finalFrame = self.previewContainer.accessibilityFrame
        
        // Start from 0.94 scale to match JS sink
        previewContainer.transform = CGAffineTransform(scaleX: 0.94, y: 0.94)
        
        UIView.animate(withDuration: 0.15) {
            self.backgroundDimView.alpha = 1
            self.blurEffectView.alpha = 1
        }
        
        UIView.animate(withDuration: 0.45, delay: 0, usingSpringWithDamping: 0.75, initialSpringVelocity: 0.5, options: .curveEaseOut) {
            self.previewContainer.frame = finalFrame
            self.previewContainer.transform = CGAffineTransform(scaleX: 1.05, y: 1.05)
            self.previewContainer.layer.shadowOpacity = 0.5
            
            self.reactionsContainer.alpha = 1
            self.menuContainer.alpha = 1
        }
    }
    
    @objc func dismiss() {
        UIView.animate(withDuration: 0.3, delay: 0, usingSpringWithDamping: 0.9, initialSpringVelocity: 0, options: .curveEaseIn) {
            // Drop back to original position and scale
            self.previewContainer.frame = self.targetRect
            self.previewContainer.transform = .identity
            self.previewContainer.layer.shadowOpacity = 0
            
            self.reactionsContainer.alpha = 0
            self.menuContainer.alpha = 0
            self.backgroundDimView.alpha = 0
            self.blurEffectView.alpha = 0
        } completion: { _ in
            self.onDismiss?()
            self.removeFromSuperview()
        }
    }
}

import UIKit
import React

class NativeChatListView: UIView, UITableViewDataSource, UITableViewDelegate {
    
    private let tableView = UITableView()
    private var _messages: [[String: Any]] = []
    private var currentUserId: String? = nil
    @objc var theme: [String: Any]? {
        didSet { tableView.reloadData() }
    }
    
    @objc var onMessagePress: RCTDirectEventBlock?
    @objc var onLoadMore: RCTDirectEventBlock?
    
    @objc var messages: [[String: Any]] {
        set {
            _messages = newValue
            extractCurrentUserId()
            updateLayoutsAndReload()
        }
        get { return _messages }
    }
    
    // Layout Cache
    private var layoutCache: [String: ChatCellLayout] = [:]
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupTableView()
    }

    convenience init() {
        self.init(frame: .zero)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setupTableView() {
        tableView.frame = self.bounds
        tableView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        tableView.dataSource = self
        tableView.delegate = self
        tableView.separatorStyle = .none
        tableView.backgroundColor = .clear
        tableView.register(MessageBubbleCell.self, forCellReuseIdentifier: MessageBubbleCell.reuseId)
        
        // Invert table view just like Telegram/React Native
        tableView.transform = CGAffineTransform(scaleX: 1, y: -1)
        
        // Performance optimizations for UITableView
        tableView.estimatedRowHeight = 0
        tableView.estimatedSectionHeaderHeight = 0
        tableView.estimatedSectionFooterHeight = 0
        tableView.contentInset = UIEdgeInsets(top: MessageListConstants.listPaddingTop, left: 0, bottom: 0, right: 0)

        addSubview(tableView)
    }
    
    private func extractCurrentUserId() {
        // Simple heuristic: if we have "isMyMessage" explicitly, use it.
        // Otherwise, we might need a prop for currentUserId.
    }
    
    private func updateLayoutsAndReload() {
        let width = self.bounds.width > 0 ? self.bounds.width : UIScreen.main.bounds.width
        let chatTheme = ChatTheme.from(themeDict: theme)

        for msg in _messages {
            guard let id = msg["id"] as? String ?? msg["message_id"] as? String else { continue }
            if layoutCache[id] == nil {
                layoutCache[id] = ChatCellLayout.calculate(for: msg, maxWidth: width, theme: chatTheme)
            }
        }
        
        if Thread.isMainThread {
            self.tableView.reloadData()
        } else {
            DispatchQueue.main.async {
                self.tableView.reloadData()
            }
        }
    }
    
    // MARK: - UITableViewDataSource
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return _messages.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: MessageBubbleCell.reuseId, for: indexPath) as! MessageBubbleCell
        let msg = _messages[indexPath.row]
        let id = msg["id"] as? String ?? msg["message_id"] as? String ?? ""
        let chatTheme = ChatTheme.from(themeDict: theme)
        if let layout = layoutCache[id] {
            cell.configure(with: msg, layout: layout, theme: chatTheme)
        }
        cell.contentView.transform = CGAffineTransform(scaleX: 1, y: -1)
        return cell
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        let msg = _messages[indexPath.row]
        let id = msg["id"] as? String ?? msg["message_id"] as? String ?? ""
        
        if let layout = layoutCache[id] {
            return layout.cellHeight
        }
        return 44
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let msg = _messages[indexPath.row]
        let id = msg["id"] as? String ?? msg["message_id"] as? String ?? ""
        onMessagePress?(["id": id])
    }
}

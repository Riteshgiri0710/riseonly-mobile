import Foundation
import React

@objc(NativeChatListViewManager)
class NativeChatListViewManager: RCTViewManager {
  override func view() -> UIView! {
    return NativeChatListView(frame: .zero)
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}

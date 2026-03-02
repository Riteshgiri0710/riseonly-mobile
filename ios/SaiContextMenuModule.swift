import Foundation
import UIKit

@objc(SaiContextMenuModule)
class SaiContextMenuModule: NSObject, RCTBridgeModule {
    
    static func moduleName() -> String! {
        return "SaiContextMenuModule"
    }
    
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc func showMenu(_ options: NSDictionary, completion: @escaping RCTResponseSenderBlock) {
        DispatchQueue.main.async {
            guard let window = UIApplication.shared.connectedScenes
                .filter({ $0.activationState == .foregroundActive })
                .first(where: { $0 is UIWindowScene })
                .flatMap({ $0 as? UIWindowScene })?
                .windows.first(where: { $0.isKeyWindow }) else {
                return
            }
            
            let menuView = SaiContextMenuView(frame: window.bounds, options: options)
            menuView.onSelect = { actionId in
                completion([actionId])
                menuView.dismiss()
            }
            
            menuView.onDismiss = {
                // Ensure we call completion even if dismissed by tap
                completion(["dismissed"])
            }
            
            window.addSubview(menuView)
            menuView.present()
        }
    }
}

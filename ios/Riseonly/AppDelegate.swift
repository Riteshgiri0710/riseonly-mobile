import Expo
import React
import ReactAppDependencyProvider
import UserNotifications

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    registerNotificationCategories()
    
    UNUserNotificationCenter.current().delegate = self

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  // MARK: - Notification Categories
  
  private func registerNotificationCategories() {
    // Get localized strings
    let replyTitle = getLocalizedString(key: "notification_reply")
    let sendTitle = getLocalizedString(key: "notification_send")
    let placeholder = getLocalizedString(key: "notification_type_message")
    let markReadTitle = getLocalizedString(key: "notification_mark_as_read")
    
    // Define Reply action with text input (localized)
    let replyAction = UNTextInputNotificationAction(
      identifier: "REPLY_ACTION",
      title: replyTitle,
      options: [.authenticationRequired],
      textInputButtonTitle: sendTitle,
      textInputPlaceholder: placeholder
    )
    
    // Define Mark as Read action (localized)
    let markReadAction = UNNotificationAction(
      identifier: "MARK_READ_ACTION",
      title: markReadTitle,
      options: [.authenticationRequired]
    )
    
    // Create MESSAGE_CATEGORY with actions
    let messageCategory = UNNotificationCategory(
      identifier: "MESSAGE_CATEGORY",
      actions: [replyAction, markReadAction],
      intentIdentifiers: [],
      options: [.customDismissAction]
    )
    
    // Register the category
    let center = UNUserNotificationCenter.current()
    center.setNotificationCategories([messageCategory])
    
    print("✅ Registered notification categories: MESSAGE_CATEGORY")
  }
  
  // MARK: - Localization Helper
  
  private func getLocalizedString(key: String) -> String {
    // Get current language from UserDefaults (shared with React Native)
    let appGroupIdentifier = "group.com.nics51.riseonly"
    var language = "en"
    
    if let userDefaults = UserDefaults(suiteName: appGroupIdentifier),
       let storedLanguage = userDefaults.string(forKey: "i18n_language") {
      language = storedLanguage
    } else {
      // Fallback to system language
      let preferredLanguage = Locale.preferredLanguages.first ?? "en"
      if preferredLanguage.hasPrefix("ru") {
        language = "ru"
      }
    }
    
    // Simple localization mapping
    let translations: [String: [String: String]] = [
      "notification_reply": [
        "ru": "Ответить",
        "en": "Reply"
      ],
      "notification_mark_as_read": [
        "ru": "Прочитано",
        "en": "Mark as Read"
      ],
      "notification_send": [
        "ru": "Отправить",
        "en": "Send"
      ],
      "notification_type_message": [
        "ru": "Введите сообщение...",
        "en": "Type a message..."
      ]
    ]
    
    if let translation = translations[key]?[language] {
      return translation
    }
    
    // Fallback to English
    return translations[key]?["en"] ?? key
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

// MARK: - UNUserNotificationCenterDelegate

extension AppDelegate: UNUserNotificationCenterDelegate {
  
  // Called when notification is received while app is in FOREGROUND
  public func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    let userInfo = notification.request.content.userInfo
    
    print("📱 Notification received in foreground")
    print("📱 UserInfo: \(userInfo)")
    
    // Send event to React Native
    NotificationHandler.shared.handleNotificationReceived(userInfo)
    
    // DON'T show notification when app is in foreground
    // User requested this behavior
    completionHandler([])
  }
  
  // Called when user TAPS on notification or action button
  public func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    
    print("🔔 Notification action: \(response.actionIdentifier)")
    print("🔔 UserInfo: \(userInfo)")
    
    // Handle different action types
    switch response.actionIdentifier {
    case UNNotificationDefaultActionIdentifier:
      // User tapped on notification itself
      NotificationHandler.shared.handleNotificationTap(userInfo)
      
    case "REPLY_ACTION":
      // User tapped Reply button
      if let textResponse = response as? UNTextInputNotificationResponse {
        let messageText = textResponse.userText
        print("💬 Reply text: \(messageText)")
        NotificationHandler.shared.handleNotificationReply(userInfo, messageText: messageText)
      }
      
    case "MARK_READ_ACTION":
      // User tapped Mark as Read button
      print("✅ Mark as Read tapped")
      NotificationHandler.shared.handleNotificationMarkAsRead(userInfo)
      
    default:
      // Other actions
      if response.actionIdentifier != UNNotificationDismissActionIdentifier {
        NotificationHandler.shared.handleNotificationTap(userInfo)
      }
    }
    
    completionHandler()
  }
}

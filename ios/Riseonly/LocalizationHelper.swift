//
//  LocalizationHelper.swift
//  Riseonly
//
//  Helper for getting localized strings in iOS native code
//

import Foundation

class LocalizationHelper {
    static let shared = LocalizationHelper()
    
    private let appGroupIdentifier = "group.com.nics51.riseonly"
    
    private init() {}
    
    // Get current language from UserDefaults (shared with React Native)
    private func getCurrentLanguage() -> String {
        if let userDefaults = UserDefaults(suiteName: appGroupIdentifier),
           let language = userDefaults.string(forKey: "i18n_language") {
            return language
        }
        
        // Fallback to system language
        let preferredLanguage = Locale.preferredLanguages.first ?? "en"
        if preferredLanguage.hasPrefix("ru") {
            return "ru"
        }
        return "en"
    }
    
    // Localized strings
    func localizedString(for key: String) -> String {
        let language = getCurrentLanguage()
        
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
}

import UIKit

struct ChatTheme {
    var primary_100: UIColor = .systemBlue
    var bg_200: UIColor = .secondarySystemBackground
    var textOnPrimary: UIColor = .white
    var text_100: UIColor = .label
    var secondary_100: UIColor = .secondaryLabel

    static func from(themeDict: [String: Any]?) -> ChatTheme {
        var t = ChatTheme()
        guard let dict = themeDict else { return t }
        if let s = dict["primary_100"] as? String, let c = UIColor(rgbaString: s) { t.primary_100 = c }
        if let s = dict["bg_200"] as? String, let c = UIColor(rgbaString: s) { t.bg_200 = c }
        if let s = dict["text_100"] as? String, let c = UIColor(rgbaString: s) { t.text_100 = c }
        if let s = dict["secondary_100"] as? String, let c = UIColor(rgbaString: s) { t.secondary_100 = c }
        return t
    }

    func gradientColorsForPrimary() -> [UIColor] {
        let c = primary_100
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        c.getRed(&r, green: &g, blue: &b, alpha: &a)
        let mid = UIColor(red: r * 0.615, green: g * 0.615, blue: b * 0.615, alpha: a)
        let end = UIColor(red: r, green: g, blue: b, alpha: a)
        return [c, mid, end]
    }
}

extension UIColor {
    convenience init?(rgbaString: String) {
        let trimmed = rgbaString
            .replacingOccurrences(of: "rgba(", with: "")
            .replacingOccurrences(of: "rgb(", with: "")
            .replacingOccurrences(of: ")", with: "")
        let parts = trimmed.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        guard parts.count >= 3,
              let r = Double(parts[0]).map({ CGFloat($0) / 255 }),
              let g = Double(parts[1]).map({ CGFloat($0) / 255 }),
              let b = Double(parts[2]).map({ CGFloat($0) / 255 }) else { return nil }
        let a: CGFloat = parts.count > 3 ? CGFloat(Double(parts[3]) ?? 1) : 1
        self.init(red: r, green: g, blue: b, alpha: a)
    }
}

#!/bin/bash

echo "🚀 Starting iPhone 16 Plus on port 1234..."

cd "$(dirname "$0")/.."

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in mobile project directory"
    exit 1
fi

echo "📱 Checking availability of iPhone 16 Plus..."
DEVICES=$(xcrun simctl list devices | grep "iPhone 16 Plus")

if [[ ! $DEVICES == *"iPhone 16 Plus"* ]]; then
    echo "❌ Error: iPhone 16 Plus not found in simulators"
    exit 1
fi

echo "✅ iPhone 16 Plus found"

IPHONE_16_PLUS_ID=$(xcrun simctl list devices | grep "iPhone 16 Plus" | grep -o '([A-F0-9-]*' | tr -d '(')

echo "📱 iPhone 16 Plus ID: $IPHONE_16_PLUS_ID"

echo "🔧 Starting iPhone 16 Plus (port 1234)..."
npx expo run:ios --port 1234 --device "iPhone 16 Plus"

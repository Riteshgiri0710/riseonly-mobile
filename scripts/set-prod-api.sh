#!/bin/bash

FILE_PATH="src/stores/ws/websocket-api-store.ts"

echo "🔧 Setting PROD API URL to wss://api.riseonly.net/ws"

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's|"wss://api.riseonly.net/ws"|"wss://api.riseonly.net/ws"|g' "$FILE_PATH"
    sed -i '' 's|"ws://[^"]*:8080/ws?origin=http://localhost"|"ws://192.168.31.177:8080/ws?origin=http://localhost"|g' "$FILE_PATH"
else
    sed -i 's|"wss://api.riseonly.net/ws"|"wss://api.riseonly.net/ws"|g' "$FILE_PATH"
    sed -i 's|"ws://[^"]*:8080/ws?origin=http://localhost"|"ws://192.168.31.177:8080/ws?origin=http://localhost"|g' "$FILE_PATH"
fi

echo "✅ PROD API URL updated successfully!"
echo "📝 Current config: wss://api.riseonly.net/ws"


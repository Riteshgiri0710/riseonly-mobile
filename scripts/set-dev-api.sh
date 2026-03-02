#!/bin/bash

ENV_FILE=".env"

if [[ "$OSTYPE" == "darwin"* ]]; then
    IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
else
    IP_ADDRESS=$(hostname -I | awk '{print $1}')
fi

if [ -z "$IP_ADDRESS" ]; then
    IP_ADDRESS="not my ip address ;D"
    echo "⚠️  Could not detect IP address, using default: ${IP_ADDRESS}"
else
    echo "🔍 Detected local IP: ${IP_ADDRESS}"
fi

DEV_HTTP_URL="http://${IP_ADDRESS}:8080/api"
DEV_WS_URL="ws://${IP_ADDRESS}:8085"

echo "🔧 Writing DEV API URLs to ${ENV_FILE}"
echo "   API_BASE_URL_DEV=${DEV_HTTP_URL}"
echo "   API_SOCKET_BASE_URL_DEV=${DEV_WS_URL}"

if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
fi

update_or_append() {
    local key="$1"
    local value="$2"
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        else
            sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        fi
    else
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

update_or_append "API_BASE_URL_DEV" "$DEV_HTTP_URL"
update_or_append "API_SOCKET_BASE_URL_DEV" "$DEV_WS_URL"

echo "✅ DEV API URLs updated in ${ENV_FILE}"
echo "📝 API_BASE_URL_DEV=${DEV_HTTP_URL}"
echo "📝 API_SOCKET_BASE_URL_DEV=${DEV_WS_URL}"
echo ""
echo "Ensure API_BASE_URL and API_SOCKET_BASE_URL (prod) are also set in .env for production builds."

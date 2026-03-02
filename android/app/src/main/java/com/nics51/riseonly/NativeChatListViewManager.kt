package com.nics51.riseonly

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class NativeChatListViewManager : SimpleViewManager<NativeChatListView>() {
    override fun getName() = "NativeChatListView"

    override fun createViewInstance(reactContext: ThemedReactContext): NativeChatListView {
        return NativeChatListView(reactContext)
    }

    @ReactProp(name = "messages")
    fun setMessages(view: NativeChatListView, messages: ReadableArray) {
        view.setMessages(messages)
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
        return MapBuilder.of(
            "onMessagePress", MapBuilder.of("registrationName", "onMessagePress"),
            "onLoadMore", MapBuilder.of("registrationName", "onLoadMore")
        )
    }
}

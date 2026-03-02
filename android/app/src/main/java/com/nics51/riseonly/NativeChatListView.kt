package com.nics51.riseonly

import android.content.Context
import android.graphics.Color
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter

class NativeChatListView(context: Context) : FrameLayout(context) {
    private val recyclerView: RecyclerView = RecyclerView(context)
    private val adapter: ChatAdapter = ChatAdapter()
    private var messages: List<Map<String, Any>> = emptyList()

    init {
        recyclerView.layoutManager = LinearLayoutManager(context).apply {
            reverseLayout = true
            stackFromEnd = true
        }
        recyclerView.adapter = adapter
        recyclerView.setBackgroundColor(Color.TRANSPARENT)
        addView(recyclerView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    fun setMessages(readableArray: ReadableArray) {
        val list = mutableListOf<Map<String, Any>>()
        for (i in 0 until readableArray.size()) {
            val map = readableArray.getMap(i).toHashMap()
            list.add(map)
        }
        messages = list
        adapter.notifyDataSetChanged()
    }

    inner class ChatAdapter : RecyclerView.Adapter<ChatViewHolder>() {
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ChatViewHolder {
            val textView = TextView(parent.context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
                setPadding(40, 20, 40, 20)
                textSize = 16f
            }
            return ChatViewHolder(textView)
        }

        override fun onBindViewHolder(holder: ChatViewHolder, position: Int) {
            val msg = messages[position]
            val content = msg["content"] as? String ?: ""
            val isMyMessage = msg["isMyMessage"] as? Boolean ?: false
            
            holder.textView.text = content
            holder.textView.setTextColor(if (isMyMessage) Color.BLUE else Color.BLACK)
            
            holder.textView.setOnClickListener {
                val event: WritableMap = Arguments.createMap()
                event.putString("id", msg["id"] as? String ?: "")
                (context as ThemedReactContext).getJSModule(RCTEventEmitter::class.java)
                    .receiveEvent(id, "onMessagePress", event)
            }
        }

        override fun getItemCount() = messages.size
    }

    class ChatViewHolder(val textView: TextView) : RecyclerView.ViewHolder(textView)
}

export const MESSAGE_HOLD_CONTEXT_MENU_WIDTH = 225;

export const USE_HOLD_ITEM_FOR_MESSAGE_CONTEXT_MENU = true;

/** When true with USE_HOLD_ITEM: full HoldItem only on the message being touched; others use a light View. Reduces load. */
export const USE_HOLD_ITEM_LAZY = true;

export const MESSAGE_BUBBLE_MAX_WIDTH = 280;
const MESSAGE_MSG_PADDING_H = 10;
const MESSAGE_IMAGE_PADDING_H = 3;
export const MESSAGE_MEDIA_MAX_WIDTH = MESSAGE_BUBBLE_MAX_WIDTH - MESSAGE_MSG_PADDING_H * 2 - MESSAGE_IMAGE_PADDING_H * 2;

export const chatSettingsTitleFromType = {
	"PRIVATE": "chat_private_settings_title",
	"GROUP": "chat_group_settings_title",
	"CHANNEL": "chat_channel_settings_title",
	"FAVOURITES": "NO SETTINGS TO FAVOURITES CHAT"
};

export const defaultReactions = [
	"❤️", "👍", "👎", "🔥", "🥰", "👏", "😁", "🤔", "🤯", "😱", "🤬", "😟",
	"🎉", "🤩", "🤢", "💩", "🙏", "👌", "🕊️", "🤡", "😮", "😌", "😍", "🐳",
	"❤️‍🔥", "🌚", "🌭", "💯", "🤣", "⚡", "🍌", "🏆", "💔", "🤨", "😐", "🍓",
	"🍾", "💋", "🖕", "😈", "😴", "😭", "🤓", "👻", "🧑‍💻", "👀", "🎃", "🙈",
	"😇", "😔", "🤝", "✍️", "🤗", "🫶", "🧑‍🎄", "🎄", "⛄", "💅", "😜", "🗿",
	"🆒", "💞", "🙉", "🦄", "🙂", "💊", "🙊", "😎", "👾", "🤷‍♂️", "🤷", "🤷‍♀️",
	"😡"
];
import { t } from 'i18next';
import { m } from 'mobx-toolbox';

export const createChannelSchema = m.schema({
	title: m.reset()
		.minLength(1)
		.build(),
	description: m.reset()
		.build(),
	image: m.reset()
		.build(),
	tag: m.reset()
		.minLength(3, { message: t("tag_too_short") })
		.build(),
});

export const createGroupSchema = m.schema({
	title: m.reset()
		.minLength(1)
		.build(),
	description: m.reset()
		.build(),
	image: m.reset()
		.build()
});

export const chatSettingsSchema = m.schema({
	title: m.reset()
		.minLength(1)
		.build(),
	description: m.reset()
		.build(),
	image: m.reset()
		.build()
});

export const createChatLinkSchema = m.schema({
	name: m.reset()
		.build()
});

export const editChatLinkSchema = m.schema({
	name: m.reset()
		.build(),
	expires_at: m.reset()
		.build(),
	usage_limit: m.reset()
		.build(),
	creates_join_request: m.reset()
		.build(),
});
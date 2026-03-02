import i18next from 'i18next'
import { m } from 'mobx-toolbox'

export const CreatePostSchema = m.schema({
	canComment: m.reset().build(),
	title: m.reset()
		.required({ message: i18next.t("post_title_required") })
		.minLength(3, { message: i18next.t("post_minlength") })
		.maxLength(100)
		.build(),
	content: m.reset()
		.required({ message: i18next.t("post_content_required") })
		.string()
		.build(),
	originalContent: m.reset()
		.maxLength(10000, { message: i18next.t("post_originalContent_maxlength") })
		.build(),
	hashtags: m.reset().build(),
	tags: m.reset().build(),
	images: m.reset().build()
})
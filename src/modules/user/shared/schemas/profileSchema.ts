import i18next from 'i18next';
import { m } from 'mobx-toolbox';

export const EditProfileSchema = m.schema({
	name: m.reset()
		.required({ message: i18next.t("name_required") })
		.minLength(3, { message: i18next.t("name_too_short") })
		.maxLength(32, { message: i18next.t("name_too_long") })
		.build(),
	description: m.reset()
		.maxLength(300, { message: i18next.t("description_too_long") })
		.build(),
	tag: m.reset()
		.minLength(3 + 1, { message: i18next.t("tag_too_short") })
		.maxLength(32 + 1, { message: i18next.t("tag_too_long") })
		.build(),
});

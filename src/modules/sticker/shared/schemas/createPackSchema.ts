import i18next from 'i18next';
import { m } from 'mobx-toolbox';

export const CreatePackSchema = m.schema({
	title: m.reset()
		.required({ message: i18next.t('settings_stickers_title_required') })
		.minLength(1, { message: i18next.t('settings_stickers_title_too_short') })
		.maxLength(32, { message: i18next.t('settings_stickers_title_too_long') })
		.build(),
	is_default: m.reset()
		.build(),
});

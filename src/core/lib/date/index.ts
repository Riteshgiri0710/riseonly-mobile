import { checker } from '@lib/helpers';
import { format, isSameYear, isToday, isYesterday, Locale, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { de, enUS, es, fr, it, ja, ko, ru, zhCN } from 'date-fns/locale';
import i18n from 'i18n';

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const locales: Record<string, Locale> = {
	ru,
	en: enUS,
	de,
	fr,
	es,
	it,
	ja,
	ko,
	'zh-CN': zhCN,
	// TODO: Добавить другие языки
};

const relativeDateTexts: Record<string, { today: string; yesterday: string; }> = {
	ru: { today: 'Сегодня', yesterday: 'Вчера' },
	en: { today: 'Today', yesterday: 'Yesterday' },
	de: { today: 'Heute', yesterday: 'Gestern' },
	fr: { today: 'Aujourd\'hui', yesterday: 'Hier' },
	es: { today: 'Hoy', yesterday: 'Ayer' },
	it: { today: 'Oggi', yesterday: 'Ieri' },
	ja: { today: '今日', yesterday: '昨日' },
	ko: { today: '오늘', yesterday: '어제' },
	'zh-CN': { today: '今天', yesterday: '昨天' },
	// TODO: Добавить другие языки
};

/**
 * Formats date using current language and context
 * @param dateString - строка с датой в ISO формате или объект Date
 * @param options - дополнительные опции форматирования
 * @returns отформатированная строка даты
 */
export const formatSmartDate = (
	dateString: string | Date,
	options: {
		showTime?: boolean;
		showYear?: boolean;
		timeFormat?: string;
		dateFormat?: string;
		yearFormat?: string;
		useRelativeTime?: boolean;
		timeZone?: string;
	} = {}
): string => {
	const currentLanguage = i18n.language || 'ru';
	const locale = locales[currentLanguage] || locales.en;
	const relativeTexts = relativeDateTexts[currentLanguage] || relativeDateTexts.en;

	const {
		showTime = true,
		showYear = false,
		timeFormat = 'HH:mm',
		dateFormat = 'd MMMM',
		yearFormat = 'd MMMM yyyy',
		useRelativeTime = true,
		timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow'
	} = options;

	const rawDate = typeof dateString === 'string' ? parseISO(dateString) : dateString;

	if (!rawDate) return 'Raw Date Error';
	if (isNaN(rawDate.getTime())) {
		console.error('Invalid date:', rawDate);
		return '';
	}

	const date = toZonedTime(rawDate, timeZone);

	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	const timeString = showTime ? format(date, timeFormat, { locale }) : '';

	if (useRelativeTime) {
		if (diffInSeconds < 3600) {
			return formatRelativeTime(date);
		}
		if (isToday(date)) {
			return showTime ? `${relativeTexts.today} ${timeString}` : relativeTexts.today;
		}
		if (isYesterday(date)) {
			return showTime ? `${relativeTexts.yesterday} ${timeString}` : relativeTexts.yesterday;
		}
	}

	const shouldShowYear = showYear || !isSameYear(date, new Date());
	const formattedDate = format(
		date,
		shouldShowYear ? yearFormat : dateFormat,
		{ locale }
	);

	return showTime ? `${formattedDate} ${timeString}` : formattedDate;
};

/**
 * Formats time only using user's timezone
 * @param dateString - строка с датой в ISO формате или объект Date
 * @param timeFormat - формат времени, по умолчанию 'HH:mm'
 * @param timeZone - часовой пояс, по умолчанию 'Europe/Moscow'
 * @returns отформатированная строка времени
 */
export const formatTimeDate = (
	dateString: string | Date,
	timeFormat: string = 'HH:mm',
	timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow'
): string => {
	const rawDate = typeof dateString === 'string' ? new Date(dateString) : dateString;

	if (isNaN(rawDate.getTime())) {
		console.error('Invalid date:', rawDate);
		return '';
	}

	const date = toZonedTime(rawDate, timeZone);

	return format(date, timeFormat);
};

const agoText = {
	ru: 'назад',
	en: 'ago',
	de: 'vor',
	fr: 'il y a',
	es: 'hace',
	it: 'fa',
	ja: '前',
	ko: '전',
	'zh-CN': '前',
};

/**
 * Returns a short relative date (e.g. "5 min ago", "2 h ago").
 * @param dateString - ISO date string or Date object
 * @returns Formatted relative date string
 */
export const formatRelativeTime = (dateString: string | Date): string => {
	const currentLanguage = i18n.language || 'ru';
	const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;

	if (!date) return '';

	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	const shortUnits: Record<string, Record<string, string>> = {
		ru: {
			second: 'сек. назад',
			minute: 'мин. назад',
			hour: 'ч. назад',
			day: 'д. назад',
		},
		en: {
			second: 'sec ago',
			minute: 'min ago',
			hour: 'h ago',
			day: 'd ago',
		},
		de: {
			second: 'Sek.',
			minute: 'Min.',
			hour: 'Std.',
			day: 'T.',
		},
		// TODO: Добавить другие языки
	};

	const units = shortUnits[currentLanguage] || shortUnits.en;

	if (diffInSeconds < 5) {
		return currentLanguage === 'ru' ? 'только что' : 'just now';
	}
	else if (diffInSeconds < 60) {
		return `${diffInSeconds} ${units.second}`;
	}
	else if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60);
		return `${minutes} ${units.minute}`;
	}
	else if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600);
		return `${hours} ${units.hour}`;
	}
	else {
		return formatSmartDate(date, { useRelativeTime: false });
	}
};

/**
 * Accepts milliseconds, seconds, or string and formats exact date and time for display in a popup.
 *
 * @param dateString - ISO date string or Date object
 * @returns Formatted string with exact date and time
 */
export const formatExactDate = (dateString: number | string | undefined | Date): string => {
	checker(dateString, 'formatExactDate: dateString is undefined');

	if (typeof dateString === 'number') {
		dateString = dateString > 1e12 ? dateString : dateString * 1000;
	}

	if (!dateString) return '';

	const currentLanguage = i18n.language || 'ru';
	const locale = locales[currentLanguage] || locales.en;
	const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;

	return format(date, 'd MMMM yyyy, HH:mm:ss', { locale });
};

type PluralForms = {
	one: string;
	few?: string;
	many: string;
	other?: string;
};

const participantForms: Record<string, PluralForms> = {
	ru: {
		one: 'участник',
		few: 'участника',
		many: 'участников',
	},
	en: {
		one: 'participant',
		many: 'participants',
	},
	fr: {
		one: 'participant',
		many: 'participants',
	},
};

function getPluralForm(lang: string, count: number): keyof PluralForms {
	if (lang.startsWith('ru')) {
		if (count % 10 === 1 && count % 100 !== 11) return 'one';
		if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'few';
		return 'many';
	}

	if (lang.startsWith('fr') || lang.startsWith('en')) {
		return count === 1 ? 'one' : 'many';
	}

	return count === 1 ? 'one' : 'many';
}

export function useParticipantText(count: number, i18n: any): string {
	const lang = i18n.language || 'en';
	const forms = participantForms[lang] || participantForms['en'];
	const formKey = getPluralForm(lang, count);

	return `${count} ${forms[formKey] ?? forms.many}`;
}

/**
 * Parses timestamp into a proper Date.
 * Checks magnitude: if > 1e12 then treated as milliseconds, otherwise seconds.
 * @param timestamp - Timestamp in seconds or milliseconds
 * @returns Date object
 */
export const parseTimestamp = (timestamp: number): Date => {
	return new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
};

const editedAtTexts: Record<string, { todayAt: string; yesterdayAt: string; at: string }> = {
	ru: { todayAt: 'сегодня в', yesterdayAt: 'вчера в', at: '' },
	en: { todayAt: 'today at', yesterdayAt: 'yesterday at', at: 'at' },
	de: { todayAt: 'heute um', yesterdayAt: 'gestern um', at: 'um' },
	fr: { todayAt: "aujourd'hui à", yesterdayAt: 'hier à', at: 'à' },
	es: { todayAt: 'hoy a las', yesterdayAt: 'ayer a las', at: '' },
	it: { todayAt: 'oggi alle', yesterdayAt: 'ieri alle', at: '' },
	ja: { todayAt: '今日', yesterdayAt: '昨日', at: '' },
	ko: { todayAt: '오늘', yesterdayAt: '어제', at: '' },
	'zh-CN': { todayAt: '今天', yesterdayAt: '昨天', at: '' },
};

export const formatEditedAt = (timestamp: number): string => {
	const currentLanguage = i18n.language || 'ru';
	const locale = locales[currentLanguage] || locales.en;
	const texts = editedAtTexts[currentLanguage] || editedAtTexts.en;
	const date = parseTimestamp(timestamp);
	const timeStr = format(date, 'HH:mm');
	if (isToday(date)) {
		return `${texts.todayAt} ${timeStr}`;
	}
	if (isYesterday(date)) {
		return `${texts.yesterdayAt} ${timeStr}`;
	}
	return format(date, 'dd.MM.yy HH:mm', { locale });
};

/**
 * Formats last seen time in Telegram style
 * @param timestamp - timestamp в секундах или миллисекундах
 * @param isOnline - флаг онлайн статуса (если true, может показывать "в сети")
 * @returns отформатированная строка времени последнего захода
 */
export const chatLastSeenDate = (timestamp: number, isOnline: boolean = false): string => {
	const currentLanguage = i18n.language || 'ru';
	const date = parseTimestamp(timestamp);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	const lastSeenTexts: Record<string, { was: string; online: string; recently: string; justNow: string; seconds: string; second: string; }> = {
		ru: {
			was: 'Был(а)',
			online: 'в сети',
			recently: 'недавно',
			justNow: 'только что',
			seconds: 'секунд',
			second: 'секунду'
		},
		en: {
			was: 'was',
			online: 'online',
			recently: 'recently',
			justNow: 'just now',
			seconds: 'seconds',
			second: 'second'
		},
	};

	const texts = lastSeenTexts[currentLanguage] || lastSeenTexts.en;

	if (isOnline && diffInSeconds < 5) {
		return texts.online;
	}
	else if (diffInSeconds < 10) {
		return `${texts.was} ${texts.justNow}`;
	}

	else if (diffInSeconds < 60) {
		const secondsText = currentLanguage === 'ru'
			? diffInSeconds === 1 ? texts.second : diffInSeconds < 5 ? 'секунды' : texts.seconds
			: diffInSeconds === 1 ? texts.second : texts.seconds;
		return `${texts.was} ${diffInSeconds} ${secondsText} назад`;
	}
	else if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60);
		const minutesText = currentLanguage === 'ru'
			? minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'
			: minutes === 1 ? 'minute' : 'minutes';
		return `${texts.was} ${minutes} ${minutesText} назад`;
	}
	else if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600);
		const hoursText = currentLanguage === 'ru'
			? hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'
			: hours === 1 ? 'hour' : 'hours';
		return `${texts.was} ${hours} ${hoursText} назад`;
	}
	else if (isToday(date)) {
		const timeString = format(date, 'HH:mm');
		return `${texts.was} в ${timeString}`;
	}
	else if (isYesterday(date)) {
		const timeString = format(date, 'HH:mm');
		const yesterdayText = currentLanguage === 'ru' ? 'вчера' : 'yesterday';
		return `${texts.was} ${yesterdayText} в ${timeString}`;
	}
	else {
		const dateString = format(date, 'd MMMM', { locale: locales[currentLanguage] || locales.en });
		return `${texts.was} ${dateString}`;
	}
};
import i18n from 'i18next';
import { Dispatch, SetStateAction } from 'react';

/**
 * Formats number in short form (1k, 1M, etc.) with locale
 * @param value - Число для форматирования
 * @param digits - Количество знаков после запятой (по умолчанию 1)
 * @returns Отформатированное число в виде строки
 */
export const formatNumber = (value: number, digits: number = 1): string => {
	if (value < 1000) {
		return value.toString();
	}

	const currentLocale = i18n.language;

	const suffixes: Record<string, string[]> = {
		'ru': ['', 'к', 'млн', 'млрд', 'трлн'],
		'en': ['', 'k', 'mln', 'bil', 'tril'],
		// TODO: Добавить другие языки по необходимости
	};

	const localeSuffixes = suffixes[currentLocale] || suffixes['ru'];

	const order = Math.floor(Math.log10(value) / 3);

	if (order >= localeSuffixes.length) {
		return value.toExponential(digits);
	}

	const divider = Math.pow(10, order * 3);
	const scaled = value / divider;

	let formatted: string;

	if (Number.isInteger(scaled)) {
		formatted = scaled.toString();
	} else {
		formatted = scaled.toFixed(digits);
		formatted = formatted.replace(/\.?0+$/, '');
	}

	return `${formatted}${localeSuffixes[order]}`;
};

/**
 * Formats number with locale-aware digit separators
 * @param value - Число для форматирования
 * @returns Отформатированное число с разделителями
 */
export const formatNumberWithSeparators = (value: number): string => {
	try {
		return new Intl.NumberFormat(i18n.language).format(value);
	} catch (error) {
		return value.toString();
	}
};

type CommentCountOptions = {
	count: number;
	locale?: string;
};

const wordForms = {
	ru: {
		comments: {
			one: 'комментарий',
			few: 'комментария',
			many: 'комментариев',
			other: 'комментариев'
		},
		replies: {
			one: 'ответ',
			few: 'ответа',
			many: 'ответов',
			other: 'ответов'
		}
	},
	en: {
		comments: {
			one: 'comment',
			other: 'comments'
		},
		replies: {
			one: 'reply',
			other: 'replies'
		}
	}
};

/**
 * Returns correct word form for counters
 * @param count - количество
 * @param locale - локаль ('ru' | 'en')
 * @param mode - режим ('comments' | 'replies')
 * @returns правильная форма слова
 */
const getCommentForm = (count: number, locale: string, mode: 'comments' | 'replies'): string => {
	const forms = (wordForms as any)[locale]?.[mode];

	if (!forms) return ''; // safety fallback

	if (locale === 'ru') {
		const lastDigit = Math.abs(count) % 10;
		const lastTwoDigits = Math.abs(count) % 100;

		if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
			return forms.many;
		}

		if (lastDigit === 1) {
			return forms.one;
		}

		if (lastDigit >= 2 && lastDigit <= 4) {
			return forms.few;
		}

		return forms.many;
	}

	return count === 1 ? forms.one : forms.other;
};


/**
 * Formats comment count with correct plural form
 * @param count - Количество комментариев
 * @returns Отформатированная строка с числом и правильным склонением
 */
export const formatCommentCount = (count: number, mode: 'comments' | 'replies' | null = 'comments', withWord = true): string => {
	const locale = i18n.language;
	const formattedNumber = formatNumber(count);
	const form = mode ? getCommentForm(count, locale, mode) : '';

	return withWord ? `${formattedNumber} ${form}` : formattedNumber;
};

export function numericId() {
	return new Date().getTime().toString() + Math.random().toString(36).substring(2, 15);
}

export const getMaxLengthColor = (n: number, maxLength: number) => {
	if (n >= Math.round(maxLength - 10)) return "red";
	if (n >= Math.round(maxLength / 2)) return "orange";
	return "white";
};

export const increaseInterval = (interval: number, setFunction: Dispatch<SetStateAction<number>>, maxValue: number) => {
	const ourInterval = setInterval(() => {
		setFunction(prev => {
			if (prev < maxValue) return prev + 10;
			clearInterval(ourInterval);
			return prev;
		});
	}, interval);
};

export const generateNumericId = () => {
	return new Date().getTime().toString() + Math.random().toString(36).substring(2, 15);
};

export const checkNumberForTsx = (value: number | undefined | null) => {
	return value !== undefined && value !== null && !isNaN(value);
};
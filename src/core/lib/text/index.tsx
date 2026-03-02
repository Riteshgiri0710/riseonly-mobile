import { MainText } from '@core/ui';

const formatText = (text: string, px: number = 13) => {
	return (
		<MainText px={px}>
			{text}
		</MainText>
	);
};

export { formatText };

/**
 * Formats bytes to human-readable (KB, MB, GB)
 * @param bytes - размер в байтах
 * @param decimals - количество знаков после запятой
 * @returns отформатированная строка
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
	if (bytes === 0) return '0 Б';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formats number with thousands separators
 * @param num - число для форматирования
 * @returns отформатированная строка
 */
export function formatNumber(num: number): string {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Formats percentage
 * @param value - значение (0-100)
 * @param decimals - количество знаков после запятой
 * @returns отформатированная строка с процентом
 */
export function formatPercent(value: number, decimals: number = 1): string {
	const toFixedValue = value.toFixed(decimals);
	if (isNaN(Number(toFixedValue))) return '0%';
	return toFixedValue + '%';
}

/**
 * Formats complex objects to multiline JSON for logging
 * @param data - любые данные для форматирования
 * @returns строка с отступами
 */
export function formatDiffData(data: any, maxArrayItems: number = 20): string {
	try {
		if (Array.isArray(data) && data.length > maxArrayItems) {
			const truncated = data.slice(0, maxArrayItems);
			const remaining = data.length - maxArrayItems;
			return JSON.stringify({
				__truncated: true,
				__total_items: data.length,
				__showing_first: maxArrayItems,
				__remaining: remaining,
				items: truncated
			}, null, 2);
		}

		if (data && typeof data === 'object' && !Array.isArray(data)) {
			const processed: any = {};
			for (const key in data) {
				if (Array.isArray(data[key]) && data[key].length > maxArrayItems) {
					const truncated = data[key].slice(0, maxArrayItems);
					const remaining = data[key].length - maxArrayItems;
					processed[key] = {
						__truncated: true,
						__total_items: data[key].length,
						__showing_first: maxArrayItems,
						__remaining: remaining,
						items: truncated
					};
				} else {
					processed[key] = data[key];
				}
			}
			return JSON.stringify(processed, null, 2);
		}

		return JSON.stringify(data, null, 2);
	} catch (e) {
		return String(data);
	}
}

/**
 * Computes padding for post grid
 * @param text - заголовок поста
 * @returns padding-значение (number)
 */
export function calculatePadding(text: string | undefined): number {
	if (!text) return 30;

	const length = text.length;

	if (length <= 10) return 30;
	if (length >= 50) return 10;

	return Math.round(30 - (length - 10) * (20 / 40));
};

/**
 * Removes all leading and trailing whitespace characters (spaces, tabs, line breaks) from a string.
 * @param input the original text, e.g. "   Hello world   "
 * @returns "Hello world"
 */

export function deleteSpacesFromStartAndEnd(input: string): string {
	return input.replace(/^\s+|\s+$/g, '');
}

export function formatId(dataArray: string[] | string | number | number[]): string {
	if (typeof dataArray === 'string' || typeof dataArray === 'number') return dataArray.toString();
	if (!dataArray) return '';
	if (dataArray.length === 0) return dataArray[0].toString();
	return dataArray.map((item) => item).join('-');
}

export function formatPhoneNumber(phoneNumber: string | undefined): string {
	if (!phoneNumber) return 'No phone number';
	return phoneNumber.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3 $4 $5');
}

/**
 * Strips Telegram-style markdown formatting and returns plain text.
 * Handles ***bold***, ___italic___, ~~~strikethrough~~~, `inline code`, and ```code blocks```.
 */
export function stripFormatting(text: string): string {
	if (!text || typeof text !== 'string') return '';
	let result = text;
	result = result.replace(/```\w*\n?([\s\S]*?)```/g, '$1');
	result = result.replace(/\*\*\*([^*]+?)\*\*\*/g, '$1');
	result = result.replace(/\*\*([^*]+?)\*\*/g, '$1');
	result = result.replace(/___([^_]+?)___/g, '$1');
	result = result.replace(/__([^_]+?)__/g, '$1');
	result = result.replace(/_([^_]+?)_/g, '$1');
	result = result.replace(/~~~([^~]+?)~~~/g, '$1');
	result = result.replace(/~~([^~]+?)~~/g, '$1');
	result = result.replace(/`([^`\n]+)`/g, '$1');
	return result.trim();
}

/**
 * Limits text to maxLines, truncating with ellipsis.
 */
export function limitToLines(text: string, maxLines: number): string {
	if (!text || maxLines < 1) return '';
	const lines = text.split('\n');
	if (lines.length <= maxLines) return text;
	return lines.slice(0, maxLines).join('\n') + '…';
}
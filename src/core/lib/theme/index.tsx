import { ArrowRightIcon } from '@icons/Ui/ArrowRightIcon';
import { ChatType } from '@modules/chat/stores/chats';
import { PixelRatio } from 'react-native';

export const pxToDp = (px: number) => {
	const scale = PixelRatio.get();
	return px / scale;
};

export const borderNative = (border: BorderT) => {
	if (!border) return;
	return (border + '')?.split(" ")?.splice(2)?.join(" ") || "";
};

export const heightNative = (height: HeightT) => {
	return Number((height + '')?.replace("px", ""));
};

export const pxNative = (px: PxT) => {
	return Number((px + '')?.replace("px", ""));
};

export const rgbToRgbaString = (r: number, g: number, b: number, a: number) => `rgba(${r}, ${g}, ${b}, ${a})`;

export const changeRgbA = (rgba: any, a: string | number) => {
	const arr = rgba.split(', ');
	arr[arr.length - 1] = a + ')';
	return arr.join(', ');
};

/**
 * Converts rgb string to rgba with given opacity.
 * @param rgb - строка вида "rgb(r, g, b)"
 * @param a - значение прозрачности, например "0.5"
 * @returns строка вида "rgba(r, g, b, a)"
 */
export const changeRgb = (rgb: string, a: number): string => {
	const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

	if (!match) {
		throw new Error("Invalid RGB format. Use 'rgb(r, g, b)'.");
	}

	const r = match[1];
	const g = match[2];
	const b = match[3];

	return `rgba(${r}, ${g}, ${b}, ${a})`;
};


/**
 * Creates a gradient from the given RGB/RGBA color.
 * Gradient goes from the source color to a darker one (reducing component brightness).
 * Example: rgba(255, 65, 65, 1) → rgba(255, 40, 40, 1) → rgba(255, 0, 0, 1)
 */
export const gradientFromColor = (colorStr: string): string => {
	const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);

	if (!match) {
		throw new Error("Invalid color format. Use 'rgb(r, g, b)' or 'rgba(r, g, b, a)'.");
	}

	const r = parseInt(match[1], 10);
	const g = parseInt(match[2], 10);
	const b = parseInt(match[3], 10);
	const a = match[4] ? parseFloat(match[4]) : 1;

	const maxComponent = Math.max(r, g, b);

	const start = `rgba(${r}, ${g}, ${b}, ${a})`;

	const midR = r === maxComponent ? r : Math.round(r * 0.615); // 65 * 0.615 ≈ 40
	const midG = g === maxComponent ? g : Math.round(g * 0.615);
	const midB = b === maxComponent ? b : Math.round(b * 0.615);
	const middle = `rgba(${midR}, ${midG}, ${midB}, ${a})`;

	const endR = r === maxComponent ? r : 0;
	const endG = g === maxComponent ? g : 0;
	const endB = b === maxComponent ? b : 0;
	const end = `rgba(${endR}, ${endG}, ${endB}, ${a})`;

	const gradient = `linear-gradient(to right, ${start} 0%, ${middle} 50%, ${end} 100%)`;

	return gradient;
};

export const darkenRGBA = (rgba: string | number | undefined, factor: number): string => {
	if (typeof rgba === "number" || !rgba) return "";

	const match = rgba.match(/^rgba?\((\d+), (\d+), (\d+),? ([\d.]+)?\)$/);

	if (!match) {
		throw new Error("Invalid RGBA format. Please use rgba(r, g, b, a).");
	}

	let [, rStr, gStr, bStr, aStr] = match;

	let r = parseInt(rStr, 10);
	let g = parseInt(gStr, 10);
	let b = parseInt(bStr, 10);
	let a = aStr ? parseFloat(aStr) : 1;

	const darken = (colorValue: number, factor: number): number => Math.max(0, colorValue - (colorValue * factor));

	const newR = darken(r, factor);
	const newG = darken(g, factor);
	const newB = darken(b, factor);

	return `rgba(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)}, ${a})`;
};

/**
 * Converts color to its opposite.
 * @param color - цвет в формате rgba(r, g, b, a)
 * @returns цвет в формате rgba(255 - r, 255 - g, 255 - b, a)
 */
export const oppositeColor = (color: string): string => {
	const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*(\d*\.?\d+)?\)/);
	if (!match) return color;
	const [, r, g, b, a] = match;
	return `rgba(${255 - parseInt(r, 10)}, ${255 - parseInt(g, 10)}, ${255 - parseInt(b, 10)}, ${a})`;
};

export function parseLinearGradient(gradient?: string, alpha: string = '1'): string[] {
	if (!gradient) return [];
	const regex = /(rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*(\d*\.?\d+)?\))/g;

	const matches = [...gradient.matchAll(regex)].map((match) => {
		const [, , r, g, b] = match;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	});

	return matches;
}

/**
 * Palette of 16 main colors for chat users. Chosen to be distinct and easy on the eyes.
 */
const USER_COLOR_PALETTE: string[] = [
	'rgba(255, 65, 65, 1)',    // 0: Красный
	'rgba(255, 140, 0, 1)',    // 1: Оранжевый
	'rgba(255, 200, 0, 1)',   // 2: Желтый
	'rgba(200, 220, 0, 1)',   // 3: Желто-зеленый
	'rgba(100, 200, 100, 1)', // 4: Зеленый
	'rgba(0, 200, 150, 1)',   // 5: Бирюзовый
	'rgba(0, 180, 220, 1)',   // 6: Голубой
	'rgba(50, 150, 255, 1)',  // 7: Синий
	'rgba(100, 100, 255, 1)', // 8: Сине-фиолетовый
	'rgba(150, 100, 255, 1)', // 9: Фиолетовый
	'rgba(200, 100, 255, 1)', // 10: Пурпурный
	'rgba(255, 100, 200, 1)', // 11: Розовый
	'rgba(255, 100, 150, 1)', // 12: Розово-красный
	'rgba(200, 150, 100, 1)', // 13: Коричневый
	'rgba(150, 150, 150, 1)', // 14: Серый
	'rgba(100, 200, 200, 1)', // 15: Морской
];

/**
 * Simple hash for string. Produces deterministic number from string.
 */
const simpleHash = (str: string): number => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash);
};

/**
 * Generates deterministic color for a chat user. Same user in same chat gets same color; different chats get different color.
 * 
 * @param chatId - ID чата
 * @param userId - ID пользователя
 * @returns Цвет в формате rgba(r, g, b, 1)
 * 
 * @example
 * getUserColorInChat('chat-123', 'user-456') // всегда вернет один и тот же цвет для этой пары
 * getUserColorInChat('chat-789', 'user-456') // вернет другой цвет для того же пользователя в другом чате
 */
export const getUserColorInChat = (type: ChatType, chatId: string | null | undefined, userId = "none"): string => {
	if (type === "PRIVATE") return "";

	const user_id = type === "CHANNEL" ? "none" : userId;

	const key = `${chatId}:${user_id}`;

	const hash = simpleHash(key);

	const colorIndex = hash % USER_COLOR_PALETTE.length;

	return USER_COLOR_PALETTE[colorIndex];
};

/**
 * Generates deterministic color for a chat user. Same user in same chat gets same color; different chats get different color.
 * 
 * @param chatId - ID чата
 * @param userId - ID пользователя
 * @returns Цвет в формате rgba(r, g, b, 1)
 * 
 * @example
 * getUserColorInChat('chat-123', 'user-456') // всегда вернет один и тот же цвет для этой пары
 * getUserColorInChat('chat-789', 'user-456') // вернет другой цвет для того же пользователя в другом чате
 */
export const getColorInChat = (chatId: string | null | undefined, userId = "none"): string => {
	const key = `${chatId}:${userId}`;

	const hash = simpleHash(key);

	const colorIndex = hash % USER_COLOR_PALETTE.length;

	return USER_COLOR_PALETTE[colorIndex];
};

// types

type PxT = string | number | string & {} | undefined;
type BorderT = string | number | string & {} | undefined;
type HeightT = string | number | string & {} | undefined;

// grouped btns

export const filledIconGroupedBtnsSize = 31;

export const RIGHT_ICON_HEIGHT = 13;
export const RIGHT_ICON_WIDTH = 15;
export const GROUPED_BTNS_HEIGHT = 50;

export const defaultGroupedBtsnRightIcon = <ArrowRightIcon height={RIGHT_ICON_HEIGHT} width={RIGHT_ICON_WIDTH} color={"secondary_100"} />;

// screens

export const defaultScreensHorizontalPadding = 10;
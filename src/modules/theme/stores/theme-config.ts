import { ThemeT } from "./types";

export const mainThemeKeys: Record<string, keyof ThemeT> = {
	bg_200: 'bg_200',
	border_100: 'border_100',
	radius_100: 'radius_100',
	btn_bg_300: 'btn_bg_300',
	btn_height_300: 'btn_height_300',
	btn_radius_200: 'btn_radius_200',
	primary_100: 'primary_100',
	error_100: 'error_100',
	text_100: 'text_100',
	secondary_100: 'secondary_100',
	input_bg_300: 'input_bg_300',
	input_border_300: 'input_border_300',
	input_height_300: 'input_height_300',
	input_radius_300: 'input_radius_300',
};

export const colorThemeKeys: (keyof ThemeT)[] = [
	'bg_000', 'bg_100', 'bg_200', 'bg_300', 'bg_400', 'bg_500', 'bg_600',
	'border_100', 'border_200', 'border_300', 'border_400', 'border_500', 'border_600',
	'btn_bg_000', 'btn_bg_100', 'btn_bg_200', 'btn_bg_300', 'btn_bg_400', 'btn_bg_500', 'btn_bg_600',
	'primary_100', 'primary_200', 'primary_300',
	'error_100', 'error_200', 'error_300',
	'text_100', 'secondary_100',
	'input_bg_300', 'input_border_300',
];

export const sizeThemeKeys: (keyof ThemeT)[] = [
	'radius_100', 'radius_200', 'radius_300', 'radius_400', 'radius_500', 'radius_600',
	'btn_height_100', 'btn_height_200', 'btn_height_300', 'btn_height_400', 'btn_height_500', 'btn_height_600',
	'btn_radius_000', 'btn_radius_100', 'btn_radius_200', 'btn_radius_300',
	'input_height_300', 'input_radius_300',
];

export const themeKeyLabels: Record<keyof ThemeT, string> = {
	bg_000: 'Фон 000',
	bg_100: 'Фон 100',
	bg_200: 'Фон 200 (основной)',
	bg_300: 'Фон 300',
	bg_400: 'Фон 400',
	bg_500: 'Фон 500',
	bg_600: 'Фон 600',

	border_100: 'Граница 100 (основная)',
	border_200: 'Граница 200',
	border_300: 'Граница 300',
	border_400: 'Граница 400',
	border_500: 'Граница 500',
	border_600: 'Граница 600',

	radius_100: 'Радиус 100 (основной)',
	radius_200: 'Радиус 200',
	radius_300: 'Радиус 300',
	radius_400: 'Радиус 400',
	radius_500: 'Радиус 500',
	radius_600: 'Радиус 600',

	btn_bg_000: 'Кнопка фон 000',
	btn_bg_100: 'Кнопка фон 100',
	btn_bg_200: 'Кнопка фон 200',
	btn_bg_300: 'Кнопка фон 300 (основной)',
	btn_bg_400: 'Кнопка фон 400',
	btn_bg_500: 'Кнопка фон 500',
	btn_bg_600: 'Кнопка фон 600',

	btn_height_100: 'Высота кнопки 100',
	btn_height_200: 'Высота кнопки 200',
	btn_height_300: 'Высота кнопки 300 (основная)',
	btn_height_400: 'Высота кнопки 400',
	btn_height_500: 'Высота кнопки 500',
	btn_height_600: 'Высота кнопки 600',

	btn_radius_000: 'Радиус кнопки 000',
	btn_radius_100: 'Радиус кнопки 100',
	btn_radius_200: 'Радиус кнопки 200 (основной)',
	btn_radius_300: 'Радиус кнопки 300',

	primary_100: 'Основной цвет 100',
	primary_200: 'Основной цвет 200',
	primary_300: 'Основной цвет 300',

	error_100: 'Ошибка 100',
	error_200: 'Ошибка 200',
	error_300: 'Ошибка 300',

	text_100: 'Текст (основной)',
	secondary_100: 'Вторичный текст (основной)',

	input_bg_300: 'Фон инпута (основной)',
	input_border_300: 'Граница инпута (основная)',
	input_height_300: 'Высота инпута (основная)',
	input_radius_300: 'Радиус инпута (основной)',

	mainGradientColor: 'Градиент',
};

export const getThemeKeyType = (key: keyof ThemeT): 'color' | 'size' | 'other' => {
	if (colorThemeKeys.includes(key)) return 'color';
	if (sizeThemeKeys.includes(key)) return 'size';
	return 'other';
};

export const isMainThemeKey = (key: keyof ThemeT): boolean => {
	return Object.values(mainThemeKeys).includes(key);
};


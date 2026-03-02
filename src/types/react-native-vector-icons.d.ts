declare module 'react-native-vector-icons/MaterialIcons' {
	import { Component } from 'react';
	import { ImageSourcePropType, TextProps } from 'react-native';

	interface IconProps extends TextProps {
		name: string;
		size?: number;
		color?: string;
		allowFontScaling?: boolean;
	}

	class Icon extends Component<IconProps> {
		static getImageSource(
			name: string,
			size?: number,
			color?: string,
		): Promise<ImageSourcePropType>;
		static getRawGlyphMap(): { [name: string]: number; };
		static loadFont(
			file?: string,
		): Promise<void>;
		static hasIcon(name: string): boolean;
	}

	export default Icon;
} 
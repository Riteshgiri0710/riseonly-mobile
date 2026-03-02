import { Path, Svg } from 'react-native-svg';
import { themeStore } from 'src/modules/theme/stores';

export const MoreIcon = ({ width = 15, height = 5, color = themeStore.currentTheme.text_100 }) => {
	return (
		<Svg width={width} height={height} viewBox="0 0 30 6" fill="none">
			<Path d="M3 6C4.65685 6 6 4.65685 6 3C6 1.34315 4.65685 0 3 0C1.34315 0 0 1.34315 0 3C0 4.65685 1.34315 6 3 6Z" fill={color} />
			<Path d="M15 6C16.6569 6 18 4.65685 18 3C18 1.34315 16.6569 0 15 0C13.3431 0 12 1.34315 12 3C12 4.65685 13.3431 6 15 6Z" fill={color} />
			<Path d="M27 6C28.6569 6 30 4.65685 30 3C30 1.34315 28.6569 0 27 0C25.3431 0 24 1.34315 24 3C24 4.65685 25.3431 6 27 6Z" fill={color} />
		</Svg>
	);
};
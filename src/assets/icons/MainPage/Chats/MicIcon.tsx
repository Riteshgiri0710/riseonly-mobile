import Svg, { Path, Rect } from 'react-native-svg';

export const MicIcon = ({ size = 24, color = "currentColor" }) => {
	return (
		<Svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<Path d="M12 19v3" stroke={color} />
			<Path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={color} />
			<Rect x="9" y="2" width="6" height="13" rx="3" stroke={color} />
		</Svg>
	);
};
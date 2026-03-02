import { Circle, Path, Svg } from 'react-native-svg';

export const MentionIcon = ({ size = 24, color = "currentColor" }) => {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<Circle cx="12" cy="12" r="4" />
			<Path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
		</Svg>
	);
};

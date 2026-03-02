import Svg, { Path, Rect } from 'react-native-svg';

export const ProfileSettingsIcon = ({ size = 28 }) => {
	return (
		<Svg
			width={size}
			height={size}
			viewBox="0 0 28 28"
			fill="none"
		>
			<Rect
				width={28}
				height={28}
				rx={8}
				fill={'#008DE5'}
			/>

			<Path d="M19 20V18.6667C19 17.9594 18.699 17.2811 18.1632 16.781C17.6273 16.281 16.9006 16 16.1429 16H11.8571C11.0994 16 10.3727 16.281 9.83684 16.781C9.30102 17.2811 9 17.9594 9 18.6667V20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<Path d="M14 13.3333C15.578 13.3333 16.8572 12.1394 16.8572 10.6667C16.8572 9.19391 15.578 8 14 8C12.4221 8 11.1429 9.19391 11.1429 10.6667C11.1429 12.1394 12.4221 13.3333 14 13.3333Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
};
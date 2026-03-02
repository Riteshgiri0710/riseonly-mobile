import Svg, { Path, Rect } from 'react-native-svg';

export const ChatSettingsIcon = ({ size = 28 }: any) => {
	return (
		<Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
			<Rect width="28" height="28" rx="8" fill="#FFA200" />

			<Path
				d="M16 19H7"
				stroke="white"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			<Path
				d="M21 9H12"
				stroke="white"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			<Path
				d="M19 22C20.6569 22 22 20.6569 22 19C22 17.3431 20.6569 16 19 16C17.3431 16 16 17.3431 16 19C16 20.6569 17.3431 22 19 22Z"
				stroke="white"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			<Path
				d="M9 12C10.6569 12 12 10.6569 12 9C12 7.34315 10.6569 6 9 6C7.34315 6 6 7.34315 6 9C6 10.6569 7.34315 12 9 12Z"
				stroke="white"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
};

import Svg, { Path, Rect } from 'react-native-svg'

export const SubscriptionSettingsIcon = ({ size = 28 }) => {
	return (
		<Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
			<Rect width={size} height={size} rx="8" fill="#E9C300" />
			<Path d="M7.77778 18.25L6 7.9375L10.8889 12.625L14 7L17.1111 12.625L22 7.9375L20.2222 18.25H7.77778ZM20.2222 21.0625C20.2222 21.625 19.8667 22 19.3333 22H8.66667C8.13333 22 7.77778 21.625 7.77778 21.0625V20.125H20.2222V21.0625Z" fill="white" />
		</Svg>
	)
}
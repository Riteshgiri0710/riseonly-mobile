import Svg, { Rect } from 'react-native-svg'

export const PhoneIcon = ({ size = 22, color = "white" }) => {
	return (
		<Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
			<Rect width={size} height={size} rx="6" fill={color} />
		</Svg>
	)
}
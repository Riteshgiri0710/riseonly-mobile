import Svg, { Path } from 'react-native-svg'

export const DownloadIcon = ({ size = 15, color = "white" }) => {
	return (
		<Svg width={size} height={size} viewBox="0 0 14 17" fill="none">
			<Path d="M7 1H9V7H11.5L7 11.5M7 1H5V7H2.5L7 11.5" fill={color} />
			<Path d="M7 1H9V7H11.5L7 11.5L2.5 7H5V1H7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<Path d="M1 16H13H1Z" fill={color} />
			<Path d="M1 16H13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	)
}
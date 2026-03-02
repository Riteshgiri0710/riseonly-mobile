import Svg, { Path } from 'react-native-svg'

export const PlansIcon = ({ size = 24, color = 'white' }) => {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<Path d="M9 7H7V9H9V7Z" fill={color} />
			<Path d="M9 12H7V14H9V12Z" fill={color} />
			<Path d="M9 17H7V19H9V17Z" fill={color} />
			<Path d="M17 7H12V9H17V7Z" fill={color} />
			<Path d="M17 12H12V14H17V12Z" fill={color} />
			<Path d="M17 17H12V19H17V17Z" fill={color} />
		</Svg>
	)
} 
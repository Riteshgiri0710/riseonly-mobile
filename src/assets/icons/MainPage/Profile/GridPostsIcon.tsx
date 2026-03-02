import Svg, { Path } from 'react-native-svg'

export const GridPostsIcon = ({ size = 24, color = 'white' }) => {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path d="M10 3H3V10H10V3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<Path d="M21 3H14V10H21V3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<Path d="M21 14H14V21H21V14Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<Path d="M10 14H3V21H10V14Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	)
} 
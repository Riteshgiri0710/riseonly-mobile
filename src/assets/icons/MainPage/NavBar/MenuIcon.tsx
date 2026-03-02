import Svg, { Path } from 'react-native-svg'

export const MenuIcon = ({ width = 24, height = 24, color = 'white' }) => {
	return (
		<Svg width={width} height={height} viewBox="0 0 29 21" fill="none">
			<Path d="M1.20019 2L27.2002 2M1.20019 10.5L27.2002 10.5M1.2002 19L27.2002 19" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	)
}
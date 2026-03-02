import Svg, { Path } from 'react-native-svg';

export const TextColorCustomizationIcon = ({ size = 20, color = "white" }) => {
	return (
		<Svg width={size} height={size} viewBox="0 0 14 18" fill="none">
			<Path d="M13.5 15.5V17.5H0.5V15.5H13.5ZM7.35645 0.5L11.8721 12.25H11.5439L10.5117 9.57031L10.3887 9.25H3.58105L3.45898 9.57422L2.4541 12.25H2.12793L6.64355 0.5H7.35645ZM6.44238 1.79297L4.03418 8.07129L3.77344 8.75H10.2031L9.94531 8.07227L7.55859 1.79492L7.43555 1.47266H6.56543L6.44238 1.79297Z" stroke={color} />
		</Svg>
	);
};
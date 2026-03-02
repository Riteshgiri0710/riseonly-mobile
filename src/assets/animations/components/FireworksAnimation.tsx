import fireworksAnimation from "@animations/fireworks.json";
import { Box } from '@core/ui';
import LottieView from 'lottie-react-native';
import { observer } from 'mobx-react-lite';
import { StyleProp, ViewStyle } from 'react-native';

export const FireworksAnimation = observer(({
	size = 100,
	style = {} as StyleProp<ViewStyle>
}: FireworksAnimationProps) => {
	return (
		<Box
			style={[
				{ width: size, height: size },
				style
			]}
		>
			<LottieView
				source={fireworksAnimation}
				autoPlay
				loop={true}
				speed={1}
				style={{ width: size, height: size }}
			/>
		</Box>
	);
});

interface FireworksAnimationProps {
	size?: number;
	style?: StyleProp<ViewStyle>;
}
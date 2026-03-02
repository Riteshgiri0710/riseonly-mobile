import confetiAnimation from "@animations/confeti.json";
import { Box } from '@core/ui';
import LottieView from 'lottie-react-native';
import { observer } from 'mobx-react-lite';
import { StyleProp, ViewStyle } from 'react-native';

export const ConfetiAnimation = observer(({
	size = 100,
	style = {} as StyleProp<ViewStyle>,
	debug = false
}: ConfetiAnimationProps) => {
	return (
		<Box
			style={[
				{ width: size, height: size },
				style
			]}
			debug={debug}
		>
			<LottieView
				source={confetiAnimation}
				autoPlay
				loop={true}
				speed={0.8}
				style={{ width: size, height: size }}
			/>
		</Box>
	);
});

interface ConfetiAnimationProps {
	size?: number;
	style?: StyleProp<ViewStyle>;
	debug?: boolean;
}
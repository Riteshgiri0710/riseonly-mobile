import waveAnimation from "@animations/wave.json";
import LottieView from 'lottie-react-native';
import { observer } from 'mobx-react-lite';
import { DimensionValue, StyleProp, View, ViewStyle } from 'react-native';

export const WaveAnimation = observer(({
	width = 100,
	height = 100,
	style = {}
}: WaveAnimationProps) => {

	return (
		<View
			// @ts-ignore
			style={{ ...(style || {}), width: width, height: height }}
		>
			<LottieView
				source={waveAnimation}
				autoPlay
				loop
				style={{ width: width, height: height }}
			/>
		</View>
	);
});

interface WaveAnimationProps {
	width?: DimensionValue;
	height?: DimensionValue;
	style?: StyleProp<ViewStyle>;
}
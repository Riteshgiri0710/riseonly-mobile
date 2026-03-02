import doneAnimation from "@animations/done.json";
import LottieView from 'lottie-react-native';
import { observer } from 'mobx-react-lite';
import { View } from 'react-native';

export const DoneAnimation = observer(({
	size = 100
}: PremiumIconUiProps) => {
	const style = {
		width: size,
		height: size,
	};

	return (
		<View style={style}>
			<LottieView
				source={doneAnimation}
				autoPlay
				loop={false}
				speed={1}
				style={{ width: size, height: size }}
			/>
		</View>
	);
});

interface PremiumIconUiProps {
	size?: number;
}
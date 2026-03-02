import redfire from "@animations/redfire.json";
import { MainText } from '@core/ui';
import { formatNumber } from '@lib/numbers';
import LottieView from 'lottie-react-native';
import { observer } from 'mobx-react-lite';
import { StyleProp, View, ViewStyle } from 'react-native';

export const RedfireAnimation = observer(({
	size = 100,
	viewStyle = {},
	count
}: RedfireAnimationProps) => {

	const style = {
		width: size,
		height: size,
	};

	return (
		<View style={[style, viewStyle]}>
			<View
				style={[
					style,
					{
						position: "relative",
						justifyContent: "center",
						alignItems: "center",
					}
				]}
			>
				<LottieView
					source={redfire}
					autoPlay
					loop
					speed={0.5}
					style={{
						width: size,
						height: size,
						position: "absolute",
					}}
				/>

				{count && (
					<MainText
						style={{
							textAlign: 'center',
							textShadowColor: 'rgba(0, 0, 0, 1)',
							textShadowOffset: { width: 1, height: 1 },
							textShadowRadius: 1.5,
							marginTop: 22,
							marginLeft: 3
						}}
						fontWeight='900'
						px={12.5}
					>
						{formatNumber(count)}
					</MainText>
				)}
			</View>
		</View>
	);
});

interface RedfireAnimationProps {
	size?: number;
	viewStyle?: StyleProp<ViewStyle>;
	count?: number;
}

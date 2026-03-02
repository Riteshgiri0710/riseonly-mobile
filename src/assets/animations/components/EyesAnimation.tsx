import eyesAnimation from "@animations/eyes.json";
import { Box, MainText } from '@core/ui';
import LottieView from 'lottie-react-native';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { StyleProp, ViewStyle } from 'react-native';

export const EyesAnimation = observer(({
	size = 100,
	textSize = 15,
	text = '',
	style = {} as StyleProp<ViewStyle>
}: EyesAnimationProps) => {
	const { t } = useTranslation();

	const animationStyle = {
		width: size,
		height: size,
		// @ts-ignore
		...style
	};

	return (
		<Box style={animationStyle}>
			<LottieView
				source={eyesAnimation}
				autoPlay
				loop={true}
				speed={1}
				style={{ width: size, height: size }}
			/>
			{text && (
				<Box centered>
					<MainText
						fontWeight='bold'
						tac='center'
						px={textSize}
					>
						{t(text)}
					</MainText>
				</Box>
			)}
		</Box>
	);
});

interface EyesAnimationProps {
	size?: number;
	text?: string;
	style?: StyleProp<ViewStyle>;
	textSize?: number;
}
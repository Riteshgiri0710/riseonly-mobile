import logoAnimation from "@animations/logo.json";
import { Box } from '@core/ui';
import LottieView from 'lottie-react-native';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

export const LogoAnimation = observer(({
	size = 100,
	style = {} as StyleProp<ViewStyle>,
	debug = false,
	autoPlay = true,
	loop = true,
	animationDuration = 1000,
	fadeOutDuration = 300,
	scaleInDuration = 1000,
	onAnimationFinish = () => { }
}: LogoAnimationProps) => {

	const fadeAnim = useRef(new Animated.Value(1)).current;
	const scaleAnim = useRef(new Animated.Value(0.7)).current;

	useEffect(() => {
		Animated.timing(scaleAnim, {
			toValue: 1,
			duration: scaleInDuration,
			useNativeDriver: true,
		}).start();

		const timer = setTimeout(() => {
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: fadeOutDuration,
				useNativeDriver: true,
			}).start(() => {
				onAnimationFinish();
			});
		}, animationDuration - fadeOutDuration);

		return () => clearTimeout(timer);
	}, [animationDuration, fadeOutDuration, scaleInDuration]);

	return (
		<Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
			<Box
				style={[
					{ width: size, height: size, transform: [{ scale: 2 }] },
					style,
				]}
				debug={debug}
			>
				<LottieView
					source={logoAnimation}
					loop={loop}
					speed={1}
					resizeMode="contain"
					style={{ width: size, height: size }}
					autoPlay={autoPlay}
				/>
			</Box>
		</Animated.View>
	);
});

interface LogoAnimationProps {
	size?: number;
	style?: StyleProp<ViewStyle>;
	debug?: boolean;
	autoPlay?: boolean;
	loop?: boolean;
	onAnimationFinish?: () => void;
	animationDuration?: number;
	fadeOutDuration?: number;
	scaleInDuration?: number;
}
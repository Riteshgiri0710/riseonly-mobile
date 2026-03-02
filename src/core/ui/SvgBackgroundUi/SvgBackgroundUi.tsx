import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming
} from 'react-native-reanimated';

export interface SvgBackgroundProps {
	/** Primary gradient color (CSS color value) */
	colorStart?: string;
	/** Secondary gradient color (CSS color value) */
	colorEnd?: string;
	/** Background opacity (0-1) */
	opacity?: number;
	/** Blur intensity (not used in this implementation) */
	blurIntensity?: number;
	/** Turbulence frequency for noise effect */
	turbulenceFrequency?: number;
	animated?: boolean;
	animationSpeed?: number;
	style?: ViewStyle;
	children?: React.ReactNode;
	/** Darkness overlay (0 = fully light, 1 = fully dark) */
	darkness?: number;
}

export interface HSLColor {
	h: number;
	s: number;
	l: number;
}

export function parseHSL(hslString: string): HSLColor | null {
	const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
	if (!match) return null;
	return {
		h: parseInt(match[1]),
		s: parseInt(match[2]),
		l: parseInt(match[3])
	};
}

function interpolateHue(h1: number, h2: number, t: number): number {
	'worklet';
	const diff = h2 - h1;
	if (Math.abs(diff) > 180) {
		if (diff > 0) {
			h1 += 360;
		} else {
			h2 += 360;
		}
	}
	return ((h1 + (h2 - h1) * t) + 360) % 360;
}

function hslToHex(h: number, s: number, l: number): string {
	'worklet';
	const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
	const x = c * (1 - Math.abs((h / 60) % 2 - 1));
	const m = l / 100 - c / 2;

	let r = 0, g = 0, b = 0;

	if (0 <= h && h < 60) {
		r = c; g = x; b = 0;
	} else if (60 <= h && h < 120) {
		r = x; g = c; b = 0;
	} else if (120 <= h && h < 180) {
		r = 0; g = c; b = x;
	} else if (180 <= h && h < 240) {
		r = 0; g = x; b = c;
	} else if (240 <= h && h < 300) {
		r = x; g = 0; b = c;
	} else if (300 <= h && h < 360) {
		r = c; g = 0; b = x;
	}

	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);

	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export const SvgBackgroundUi: React.FC<SvgBackgroundProps> = ({
	colorStart = 'hsl(129, 100%, 72%)',
	colorEnd = 'hsl(227, 100%, 50%)',
	opacity = 1,
	blurIntensity = 36,
	turbulenceFrequency = 0.007,
	animated = false,
	animationSpeed = 1,
	style = {},
	children,
	darkness = 0,
}) => {
	// Animation drivers
	const time1 = useSharedValue(0);
	const time2 = useSharedValue(0);
	const time3 = useSharedValue(0);
	const rotation = useSharedValue(0);

	// Memoize parsed HSL colors
	const startHSL = useMemo(() => parseHSL(colorStart), [colorStart]);
	const endHSL = useMemo(() => parseHSL(colorEnd), [colorEnd]);

	// Start native animations
	useEffect(() => {
		if (animated) {
			// Reset values to ensure smooth transitions when props change
			time1.value = 0;
			time2.value = 0;
			time3.value = 0;
			rotation.value = 0;

			// Multiple time drivers for complex wave patterns
			time1.value = withRepeat(
				withTiming(1, {
					duration: 4300 / animationSpeed,
					easing: Easing.linear
				}),
				-1,
				true // Use true for smooth looping
			);

			time2.value = withRepeat(
				withTiming(1, {
					duration: 5700 / animationSpeed,
					easing: Easing.linear
				}),
				-1,
				true // Use true for smooth looping
			);

			time3.value = withRepeat(
				withTiming(1, {
					duration: 7100 / animationSpeed,
					easing: Easing.linear
				}),
				-1,
				true // Use true for smooth looping
			);

			rotation.value = withRepeat(
				withTiming(360, {
					duration: 23000 / animationSpeed,
					easing: Easing.linear
				}),
				-1,
				true // Use true for smooth looping
			);
		} else {
			// If animation is disabled, reset values without animation
			time1.value = 0;
			time2.value = 0;
			time3.value = 0;
			rotation.value = 0;
		}

		// Clean up animations when component unmounts or animated prop changes
		return () => {
			// Cancel all animations
			time1.value = 0;
			time2.value = 0;
			time3.value = 0;
			rotation.value = 0;
		};
	}, [animated, animationSpeed]);

	// Main lava layer
	const lavaLayer1Style = useAnimatedStyle(() => {
		if (!animated) return { opacity };

		const t1 = time1.value * Math.PI * 2;
		const t2 = time2.value * Math.PI * 2;
		const t3 = time3.value * Math.PI * 2;

		// Более сложные волновые функции для органического движения
		const wave1 = Math.sin(t1 * 2.7) * 0.4;
		const wave2 = Math.cos(t2 * 1.9) * 0.3;
		const wave3 = Math.sin(t3 * 3.1) * 0.2;
		const scale = 1 + (wave1 + wave2 + wave3) * 0.04;

		const rotationVal = rotation.value + Math.sin(t1 * 1.1) * 5 + Math.cos(t2 * 0.7) * 3;

		return {
			transform: [
				{ rotate: `${rotationVal}deg` },
				{ scale: scale },
				{ translateX: Math.sin(t1 * 0.5) * 10 + Math.cos(t3 * 0.8) * 5 },
				{ translateY: Math.cos(t2 * 0.3) * 8 + Math.sin(t1 * 0.6) * 4 },
			],
			opacity,
		};
	}, [animated, opacity]);

	// Second lava layer
	const lavaLayer2Style = useAnimatedStyle(() => {
		if (!animated) return { opacity: opacity * 0.7 };

		const t1 = time1.value * Math.PI * 2;
		const t2 = time2.value * Math.PI * 2;
		const t3 = time3.value * Math.PI * 2;

		const wave1 = Math.cos(t2 * 3.8) * 0.3;
		const wave2 = Math.sin(t3 * 1.3) * 0.4;
		const wave3 = Math.cos(t1 * 2.4) * 0.25;
		const scale = 1.1 + (wave1 + wave2 + wave3) * 0.06;

		const rotationVal = -rotation.value * 0.7 + Math.cos(t2 * 1.2) * 8 + Math.sin(t3 * 0.9) * 4;

		return {
			transform: [
				{ rotate: `${rotationVal}deg` },
				{ scale: scale },
				{ translateX: Math.cos(t2 * 0.7) * 12 + Math.sin(t1 * 1.1) * 6 },
				{ translateY: Math.sin(t3 * 0.4) * 10 + Math.cos(t2 * 0.8) * 5 },
			],
			opacity: opacity * 0.7,
		};
	}, [animated, opacity]);

	// Third lava layer
	const lavaLayer3Style = useAnimatedStyle(() => {
		if (!animated) return { opacity: opacity * 0.5 };

		const t1 = time1.value * Math.PI * 2;
		const t2 = time2.value * Math.PI * 2;
		const t3 = time3.value * Math.PI * 2;

		const wave1 = Math.sin(t1 * 4.7) * 0.2;
		const wave2 = Math.cos(t3 * 2.8) * 0.3;
		const wave3 = Math.sin(t2 * 1.6) * 0.25;
		const scale = 0.9 + (wave1 + wave2 + wave3) * 0.08;

		const rotationVal = rotation.value * 1.3 + Math.sin(t3 * 1.4) * 10 + Math.cos(t1 * 0.6) * 6;

		return {
			transform: [
				{ rotate: `${rotationVal}deg` },
				{ scale: scale },
				{ translateX: Math.sin(t1 * 0.9) * 8 + Math.cos(t2 * 1.3) * 7 },
				{ translateY: Math.cos(t3 * 0.6) * 12 + Math.sin(t2 * 0.4) * 6 },
			],
			opacity: opacity * 0.5,
		};
	}, [animated, opacity]);

	// Fourth layer for more complexity
	const lavaLayer4Style = useAnimatedStyle(() => {
		if (!animated) return { opacity: opacity * 0.3 };

		const t1 = time1.value * Math.PI * 2;
		const t2 = time2.value * Math.PI * 2;
		const t3 = time3.value * Math.PI * 2;

		const wave1 = Math.cos(t1 * 2.3) * 0.5;
		const wave2 = Math.sin(t2 * 1.7) * 0.3;
		const wave3 = Math.cos(t3 * 3.4) * 0.2;
		const scale = 1.2 + (wave1 + wave2 + wave3) * 0.05;

		const rotationVal = -rotation.value * 0.5 + Math.cos(t1 * 0.8) * 12 + Math.sin(t2 * 1.1) * 8;

		return {
			transform: [
				{ rotate: `${rotationVal}deg` },
				{ scale: scale },
				{ translateX: Math.cos(t1 * 1.2) * 15 + Math.sin(t3 * 0.9) * 8 },
				{ translateY: Math.sin(t2 * 0.8) * 18 + Math.cos(t1 * 0.5) * 10 },
			],
			opacity: opacity * 0.3,
		};
	}, [animated, opacity]);

	const containerStyle = useMemo((): ViewStyle => ({
		...style,
	}), [style]);

	const { width, height } = Dimensions.get('window');
	const gradientSize = Math.max(width, height) * 3;

	// Static gradient colors with some variation
	const baseColors: [string, string] = [colorStart, colorEnd];
	const variantColors1: [string, string] = [colorEnd, colorStart];
	const variantColors2: [string, string] = [
		colorStart.replace(/(\d+)/, (match) => String(Math.max(0, parseInt(match) - 30))),
		colorEnd.replace(/(\d+)/, (match) => String(Math.min(360, parseInt(match) + 30)))
	];

	return (
		<View style={[styles.container, containerStyle]}>
			{/* Base layer */}
			<View style={styles.gradientContainer}>
				<LinearGradient
					colors={baseColors}
					style={[styles.gradient, { width: gradientSize, height: gradientSize }]}
					start={{ x: 0.3, y: 0.1 }}
					end={{ x: 0.7, y: 0.9 }}
					locations={[0, 1]}
				/>
			</View>

			{/* Animated lava layers */}
			<Animated.View style={[styles.gradientContainer, lavaLayer1Style]}>
				<LinearGradient
					colors={variantColors1}
					style={[styles.gradient, { width: gradientSize, height: gradientSize }]}
					start={{ x: 0.2, y: 0.2 }}
					end={{ x: 0.8, y: 0.8 }}
					locations={[0.2, 0.8]}
				/>
			</Animated.View>

			<Animated.View style={[styles.gradientContainer, lavaLayer2Style]}>
				<LinearGradient
					colors={[`${colorStart}CC`, `${colorEnd}CC`]}
					style={[styles.gradient, { width: gradientSize, height: gradientSize }]}
					start={{ x: 0.1, y: 0.8 }}
					end={{ x: 0.9, y: 0.2 }}
					locations={[0.1, 0.9]}
				/>
			</Animated.View>

			<Animated.View style={[styles.gradientContainer, lavaLayer3Style]}>
				<LinearGradient
					colors={variantColors2}
					style={[styles.gradient, { width: gradientSize, height: gradientSize }]}
					start={{ x: 0.6, y: 0.1 }}
					end={{ x: 0.4, y: 0.9 }}
					locations={[0.3, 0.7]}
				/>
			</Animated.View>

			<Animated.View style={[styles.gradientContainer, lavaLayer4Style]}>
				<LinearGradient
					colors={[`${colorEnd}99`, `${colorStart}99`]}
					style={[styles.gradient, { width: gradientSize, height: gradientSize }]}
					start={{ x: 0.8, y: 0.3 }}
					end={{ x: 0.2, y: 0.7 }}
					locations={[0, 1]}
				/>
			</Animated.View>

			{/* Darkness overlay */}
			{darkness > 0 && (
				<View
					style={[
						styles.overlay,
						{
							backgroundColor: `rgba(0, 0, 0, ${darkness})`,
						},
					]}
				/>
			)}

			{/* Content */}
			<View style={styles.content}>
				{children}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		overflow: 'hidden',
	},
	gradientContainer: {
		position: 'absolute',
		top: -500,
		left: -500,
		right: -500,
		bottom: -500,
		zIndex: 0,
		justifyContent: 'center',
		alignItems: 'center',
	},
	gradient: {
		flex: 1,
	},
	overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 5,
		pointerEvents: 'none',
	},
	content: {
		position: 'relative',
		zIndex: 10,
		flex: 1,
		width: '100%',
		height: '100%',
	},
});

import { darkenRGBA } from '@lib/theme';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Animated, NativeModules, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

interface AnimatedHeaderProps {
	content: React.ReactNode;
	backgroundColor?: string;
	textColor?: string;
	status?: "pending" | "fulfilled" | "rejected" | undefined;
	loadingComponent?: React.ReactNode;
}

export const AnimatedHeader = forwardRef<{ handleScroll: (event: any) => void; }, AnimatedHeaderProps>(
	({
		content,
		backgroundColor = themeStore.currentTheme.bg_200,
		textColor = '#fff',
		status = 'idle',
		loadingComponent
	}, ref) => {
		const [safeAreaHeight, setSafeAreaHeight] = useState(0);
		const lastScrollY = useRef(0);
		const isScrollingDown = useRef(true);
		const scrollDistance = useRef<any>(new Animated.Value(0)).current;

		const animValues = useRef({
			topHeaderTranslate: new Animated.Value(-safeAreaHeight)
		}).current;

		useImperativeHandle(ref, () => ({
			handleScroll: (event: any) => {
				const currentScrollY = event.nativeEvent.contentOffset.y;

				if (currentScrollY > lastScrollY.current) {
					if (isScrollingDown.current) isScrollingDown.current = false;
					const newValue = Math.min(safeAreaHeight, scrollDistance._value + (currentScrollY - lastScrollY.current));
					scrollDistance.setValue(newValue);
				} else if (currentScrollY < lastScrollY.current) {
					if (!isScrollingDown.current) isScrollingDown.current = true;
					const newValue = Math.max(0, scrollDistance._value - (lastScrollY.current - currentScrollY));
					scrollDistance.setValue(newValue);
				}

				lastScrollY.current = currentScrollY;
			}
		}));

		useEffect(() => {
			const { StatusBarManager } = NativeModules;
			if (Platform.OS === 'ios') {
				if (StatusBarManager?.getHeight) {
					StatusBarManager.getHeight((statusBarFrameData: { height: any; }) => {
						const statusBarHeight = statusBarFrameData.height;
						setSafeAreaHeight(statusBarHeight);
					});
				}
			} else {
				setSafeAreaHeight(StatusBarManager.HEIGHT || 20);
			}
		}, []);

		const bottomHeaderTranslate = scrollDistance.interpolate({
			inputRange: [0, safeAreaHeight],
			outputRange: [0, -safeAreaHeight],
			extrapolate: 'clamp'
		});

		const bottomHeaderOpacity = scrollDistance.interpolate({
			inputRange: [0, safeAreaHeight / 2],
			outputRange: [1, 0],
			extrapolate: 'clamp'
		});

		const renderContent = () => {
			if (status === 'pending') {
				return loadingComponent || <ActivityIndicator size="small" color={textColor} />;
			}

			return typeof content === 'string' ? (
				<Text style={[styles.headerText, { color: textColor }]}>{content}</Text>
			) : (
				content
			);
		};

		return (
			<>
				<View style={styles.safeAreaContainer}>
					{/* TODO: Добавить блюр */}
					{/* <BlurView
						intensity={50}
						tint="light"
						style={styles.blurContainer}
					> */}
					<SafeAreaView
						style={styles.safeArea}
						onLayout={(event) => {
							const { height } = event.nativeEvent.layout;
							if (height > 0 && safeAreaHeight === 0) {
								setSafeAreaHeight(height);
								animValues.topHeaderTranslate.setValue(-height);
							}
						}}
					/>
					{/* </BlurView> */}
				</View>

				<Animated.View
					style={[
						styles.headerPart,
						{
							height: safeAreaHeight,
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							zIndex: 1000,
							backgroundColor,
							transform: [{ translateY: animValues.topHeaderTranslate }],
							opacity: 0
						}
					]}
				>
					<Text style={[styles.headerText, { color: textColor }]}>Easter Egg ;)</Text>
				</Animated.View>

				<Animated.View
					style={[
						styles.headerPart,
						{
							height: safeAreaHeight,
							position: 'absolute',
							top: safeAreaHeight,
							left: 0,
							right: 0,
							zIndex: 1000,
							opacity: bottomHeaderOpacity,
							borderBottomColor: darkenRGBA(backgroundColor, 0.5),
							borderBottomWidth: 0.75,
							transform: [{ translateY: bottomHeaderTranslate }]
						}
					]}
				>
					<View style={[styles.contentContainer, { backgroundColor: backgroundColor }]}>
						{renderContent()}
					</View>
				</Animated.View>
			</>
		);
	}
);

interface WithAnimatedHeaderProps {
	headerContent?: React.ReactNode;
	headerBackgroundColor?: string;
	headerTextColor?: string;
	status?: "pending" | "fulfilled" | "rejected" | undefined;
	loadingComponent?: React.ReactNode;
	[key: string]: any;
}

export const withAnimatedHeader = (WrappedComponent: React.ComponentType<any>) => {
	return (props: WithAnimatedHeaderProps) => {
		const scrollY = useRef(new Animated.Value(0)).current;
		const headerRef = useRef<any | null>(null);

		const handleScroll = Animated.event(
			[{ nativeEvent: { contentOffset: { y: scrollY } } }],
			{
				useNativeDriver: true,
				listener: (event) => {
					if (headerRef.current && headerRef.current.handleScroll) {
						headerRef.current.handleScroll(event);
					}
				}
			}
		);

		return (
			<View style={styles.container}>
				<AnimatedHeader
					ref={headerRef}
					content={props.headerContent || "Нижняя часть"}
					backgroundColor={props.headerBackgroundColor}
					textColor={props.headerTextColor}
					status={props.status}
					loadingComponent={props.loadingComponent}
				/>
				<WrappedComponent
					{...props}
					onScroll={handleScroll}
					scrollEventThrottle={16}
				/>
			</View>
		);
	};
};

const styles = StyleSheet.create({
	safeAreaContainer: {
		position: 'relative',
	},
	safeArea: {
		backgroundColor: themeStore.currentTheme.bg_200
	},
	container: {
		flex: 1,
	},
	blurContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		width: 100,
		height: 100,
		backgroundColor: "red",
		zIndex: 10000000,
	},
	headerPart: {
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerText: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	contentContainer: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
		gap: 10,
	}
}); 
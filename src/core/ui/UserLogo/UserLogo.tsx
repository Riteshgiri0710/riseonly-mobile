import { RedfireAnimation } from '@animations/components/RedfireAnimation';
import { defaultBanner, defaultLogo } from '@core/config/const';
import { Box, CleverImage, SimpleButtonUi } from '@core/ui';
import { BackArrowLeftIcon } from '@icons/Ui/BackArrowLeftIcon';
import { CrownIcon } from '@icons/Ui/CrownIcon';
import { useNavigation } from '@lib/navigation';
import { checkNumberForTsx } from '@lib/numbers';
import { ChatTitle } from '@modules/chat/components/Chat/Bar';
import { ChatLogo } from '@modules/chat/components/Chat/ChatLogo/ChatLogo';
import { ChatUserActivity } from '@modules/chat/components/Chat/ChatUserActivity/ChatUserActivity';
import { ChatInfo } from '@modules/chat/stores/chats';
import { Blur, Canvas, Circle, ColorMatrix, Group, Image, Paint, RoundedRect, rect, rrect, useImage } from "@shopify/react-native-skia";
import { observer } from 'mobx-react-lite';
import React, { useCallback, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated, { Extrapolate, SharedValue, interpolate, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';

interface UserLogoProps {
	source?: string | Array<string | null>;
	style?: StyleProp<ViewStyle>;
	size?: number;
	bordered?: boolean;
	borderColor?: string;
	borderWidth?: number;
	loading?: boolean;
	authorIcon?: boolean;
	isMe?: boolean;
	canvas?: boolean;
	bgColor?: string;
	scrollY?: SharedValue<number>;
	bgImage?: string;
	debugDownload?: boolean;
	isButton?: boolean;
	streakCount?: number;
	onPress?: () => void;
	isOnline?: boolean;
	withoutBackBtn?: boolean;
	noBanner?: boolean;
	noTitle?: boolean;
	stories?: any[];
	selectedChat?: ChatInfo;
}

const UserLogoComponent = observer(({
	source,
	style,
	authorIcon = false,
	bordered = false,
	borderColor = undefined,
	borderWidth = 0.5,
	stories = [],
	bgImage,
	bgColor,
	loading = false,
	scrollY,
	debugDownload = false,
	isMe = false,
	streakCount,
	canvas = false,
	isButton = false,
	onPress,
	size = 50,
	isOnline = false,
	withoutBackBtn = false,
	noBanner = false,
	noTitle = false,
	selectedChat
}: UserLogoProps) => {
	const { currentTheme, safeAreaWithContentHeight: { safeAreaWithContentHeight } } = themeStore;
	const { profile } = profileStore;

	const { width } = useWindowDimensions();

	const DYNAMIC_ISLAND_WIDTH = width / 3.4;
	const DYNAMIC_ISLAND_HEIGHT = 20;

	const imgForUseImage = source || defaultLogo;

	const bannerImage = useImage(bgImage || defaultBanner);
	const image = useImage(imgForUseImage as string);
	const maxY = safeAreaWithContentHeight + 10;
	const x = useSharedValue((width - size) / 2);
	const d = useSharedValue(size);
	const y = useSharedValue(maxY);
	const blur = useSharedValue(0);
	const xDynamicIsland = useSharedValue((width - DYNAMIC_ISLAND_WIDTH) / 2);
	const yDynamicIsland = safeAreaWithContentHeight - (safeAreaWithContentHeight / 2) - 2;
	const color = useSharedValue("transparent");
	const backgroundOpacity = useSharedValue(1);
	const backgroundColorOpacity = useSharedValue(0);
	const navigation = useNavigation();

	const onBackPress = useCallback(() => navigation.goBack(), [navigation]);

	const roundedRect = useDerivedValue(() => {
		'worklet';
		if (!scrollY) {
			return rrect(
				rect((width - size) / 2, maxY, size, size),
				size / 2,
				size / 2
			);
		}

		const scrollValue = scrollY.value;

		const diameter = interpolate(scrollValue, [0, maxY / 2], [size, 0], Extrapolate.CLAMP);
		const posX = (width - diameter) / 2;
		const posY = interpolate(scrollValue, [0, maxY], [maxY, 0], Extrapolate.CLAMP);

		return rrect(
			rect(posX, posY, diameter, diameter),
			size / 2,
			size / 2
		);
	}, [scrollY, width, size, maxY]);

	useDerivedValue(() => {
		'worklet';
		if (!scrollY) return;

		const scrollValue = scrollY.value;

		d.value = interpolate(scrollValue, [0, maxY / 2], [size, 0], Extrapolate.CLAMP);
		x.value = (width - d.value) / 2;
		y.value = interpolate(scrollValue, [0, maxY], [maxY, 0], Extrapolate.CLAMP);

		blur.value = interpolate(scrollValue, [0, 25, 40], [0, 10, 0], Extrapolate.CLAMP);

		if (scrollValue <= 0) {
			color.value = "transparent";
		} else if (scrollValue >= 20) {
			color.value = "black";
		} else if (scrollValue <= 15) {
			const progress = scrollValue / 15;
			const alpha = progress * 0.3;
			color.value = `rgba(0, 0, 0, ${alpha})`;
		} else {
			const progress = (scrollValue - 15) / 5;
			const alpha = 0.3 + (progress * 0.7);
			color.value = `rgba(0, 0, 0, ${alpha})`;
		}

		backgroundOpacity.value = interpolate(scrollValue, [0, maxY / 1.5], [1, 0], Extrapolate.CLAMP);
		backgroundColorOpacity.value = interpolate(scrollValue, [0, maxY / 1.5], [0, 1], Extrapolate.CLAMP);
	}, [scrollY, maxY, size, width]);

	const userLogoCanvasContainerHeight = noTitle ? 120 : 160;

	const animatedStyle = useAnimatedStyle(() => {
		'worklet';
		if (!scrollY) return {
			width: "100%",
			height: safeAreaWithContentHeight + userLogoCanvasContainerHeight
		};

		const scrollValue = scrollY.value;

		return {
			width: "100%",
			height: interpolate(scrollValue, [0, 100], [safeAreaWithContentHeight + 160, 100], Extrapolate.CLAMP),
		};
	}, [scrollY, safeAreaWithContentHeight]);

	const contentAnimatedStyle = useAnimatedStyle(() => {
		'worklet';
		if (!scrollY) {
			return {
				position: 'absolute' as const,
				bottom: 5,
				width: '100%',
				transform: [{ translateY: 0 }],
			};
		}

		const scrollValue = scrollY.value;

		let translateY: number;
		if (scrollValue <= 0) {
			translateY = 0;
		} else if (scrollValue >= 30) {
			translateY = 50;
		} else {
			translateY = (scrollValue / 30) * 50;
		}

		return {
			position: 'absolute' as const,
			bottom: 5,
			width: '100%',
			transform: [{ translateY }],
			pointerEvents: scrollValue >= 30 ? 'none' as const : 'auto' as const,
		};
	}, [scrollY]);

	const backButtonAnimatedStyle = useAnimatedStyle(() => {
		'worklet';
		if (!scrollY) {
			return {
				position: 'absolute' as const,
				top: safeAreaWithContentHeight + 10,
				left: 12,
				zIndex: 10001,
			};
		}

		const scrollValue = scrollY.value;
		let top: number;
		if (scrollValue <= 30) {
			top = safeAreaWithContentHeight + 10;
		} else if (scrollValue >= 60) {
			top = safeAreaWithContentHeight + 8;
		} else {
			const progress = (scrollValue - 30) / 30;
			top = safeAreaWithContentHeight + 10 - (progress * 2);
		}

		return {
			position: 'absolute' as const,
			top,
			left: 12,
			zIndex: 10001,
		};
	}, [scrollY, safeAreaWithContentHeight]);

	if (canvas) {
		return (
			<>
				{withoutBackBtn && (
					<Animated.View style={backButtonAnimatedStyle}>
						<SimpleButtonUi
							onPress={onBackPress}
							style={{
								width: 40,
								height: 40,
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<BackArrowLeftIcon
								height={20}
								width={12.5}
								color={currentTheme.primary_100}
							/>
						</SimpleButtonUi>
					</Animated.View>
				)}

				<Animated.View
					style={[animatedStyle, { overflow: 'hidden' as const, alignItems: "center", justifyContent: "center" }]}
					renderToHardwareTextureAndroid={true}
					shouldRasterizeIOS={true}
				>
					<Canvas
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							zIndex: -2
						}}
						pointerEvents="none"
					>
						{!noBanner && (
							<Image
								image={bannerImage}
								width={width}
								height={220}
								x={0}
								y={0}
								opacity={backgroundOpacity}
							>
								<Blur blur={2} />
							</Image>
						)}

						<RoundedRect
							r={0}
							x={0}
							y={0}
							width={width}
							height={220}
							color={currentTheme.bg_200}
							opacity={backgroundColorOpacity}
						/>
					</Canvas>

					{/* <Canvas
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							zIndex: -1,
						}}
						pointerEvents="none"
					>
						<Group
							layer={
								<Paint>
									<Blur blur={blur} />
									<ColorMatrix
										matrix={[
											1, 0, 0, 0, 0,
											0, 1, 0, 0, 0,
											0, 0, 1, 0, 0,
											0, 0, 0, 18, -6
										]}
									/>
								</Paint>
							}
						>
							<Group clip={roundedRect}>
								<Image
									image={image}
									width={size}
									height={size}
									x={x}
									y={y}
									fit="cover"
								/>
								<Circle
									r={d}
									cx={x}
									cy={y}
									color={color}
								/>
							</Group>
							<RoundedRect
								r={30}
								width={DYNAMIC_ISLAND_WIDTH}
								height={DYNAMIC_ISLAND_HEIGHT}
								x={xDynamicIsland}
								y={yDynamicIsland}
								color={currentTheme.bg_200}
							/>
						</Group>
					</Canvas> */}

					<ChatLogo
						size={100}
						type={selectedChat?.type}
						chat={selectedChat}
					/>

					{!noTitle && (
						<Animated.View
							style={[
								contentAnimatedStyle,
								{
									height: 40,
									overflow: 'hidden' as const,
								}
							]}
							renderToHardwareTextureAndroid={true}
							shouldRasterizeIOS={true}
							collapsable={false}
							removeClippedSubviews={true}
						>
							{useMemo(() => (
								<Box
									style={styles.namesSticky}
									pointerEvents="box-none"
								>
									<Box
										style={styles.namesTop}
										pointerEvents="box-none"
									>
										<ChatTitle
											chat={selectedChat}
											usernamePx={22}
											titlePx={18}
											favPx={18}
											fontWeight="normal"
										/>
									</Box>

									<ChatUserActivity />
								</Box>
							), [selectedChat])}
						</Animated.View>
					)}
				</Animated.View>
			</>
		);
	}

	const Component = isButton ? SimpleButtonUi : View;

	return (
		<Component
			style={styles.box}
			onPress={(event) => {
				if (!event) return;
				event.preventDefault();
				event.stopPropagation();
				if (onPress) onPress();
			}}
		>
			{authorIcon && (
				<Box
					style={[
						styles.authorIcon,
						{ backgroundColor: currentTheme.bg_200, }
					]}
					centered
				>
					<CrownIcon
						color={"#e3d700"}
						width={11}
						height={11}
					/>
				</Box>
			)}

			{isOnline && (
				<Box
					style={[
						styles.onlineIcon,
						{ backgroundColor: currentTheme.bg_200, }
					]}
					centered
				>
					<Box
						bgColor={"rgb(56, 223, 14)"}
						width={10}
						height={10}
						bRad={1000}
					/>
				</Box>
			)}

			<View
				style={[
					styles.profileLogoContainer,
					{
						width: size,
						height: size,
						borderColor: bordered ? (borderColor ? borderColor : currentTheme.border_100) : undefined,
						borderWidth: bordered ? borderWidth : 0,
						position: 'relative',
						backgroundColor: currentTheme.bg_200,
					},
					style
				]}
			>
				{/* <Box
					style={[
						styles.overlay,
						{
							width: size,
							height: size,
						}
					]}
				/> */}
				{Array.isArray(source) ? (
					<View
						style={[
							styles.multipleLogos,
							{ width: size, height: size }
						]}
					>
						{source?.length > 0 && source.map((url, i) => (
							<CleverImage
								key={url}
								source={url || defaultLogo}
								type="user"
								withoutWrapper
								debugDownload={debugDownload}
								imageStyles={{
									...styles.profileLogo,
									zIndex: source.length - i,
									position: 'absolute',
									top: 0,
									left: 0,
									width: size,
									height: size,
									transform: [{ translateX: i * 10 }, { translateY: i * 10 }]
								}}
							/>
						))}
					</View>
				) : (
					<CleverImage
						source={isMe ? profile?.more?.logo : (source ? (source == profile?.more?.logo ? profile?.more?.logo : source) : defaultLogo)}
						imageStyles={styles.profileLogo}
						type="user"
						debugDownload={debugDownload}
						withoutWrapper
					/>
				)}
			</View>

			{(checkNumberForTsx(streakCount) && streakCount! > 0) && (
				<RedfireAnimation
					viewStyle={{ zIndex: 1000, position: "absolute", right: 0, bottom: 0 }}
					size={45}
					count={streakCount}
				/>
			)}

			{/* <LoaderUi
				style={styles.loading}
				color='white'
				size={"small"}
			/> */}
		</Component>
	);
});

const styles = StyleSheet.create({
	onlineIcon: {
		position: "absolute",
		borderRadius: 10000,
		bottom: 0,
		right: -1.5,
		zIndex: 1000,
		width: 15,
		height: 15
	},
	loading: {
		position: 'absolute',
	},
	profileLogoContainer: {
		borderRadius: 50,
		overflow: 'hidden',
	},
	profileLogo: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
		zIndex: 1000,
	},
	overlay: {
		zIndex: 1001,
		backgroundColor: "rgba(0, 0, 0, 0.7)",
		position: 'absolute'
	},
	multipleLogos: {
		position: 'relative',
	},
	authorIcon: {
		position: "absolute",
		borderRadius: 10000,
		top: -5,
		right: -5,
		zIndex: 1000,
		width: 17,
		height: 17
	},
	box: {
		position: 'relative',
		alignItems: "center",
		justifyContent: "center",
	},
	mid: { flex: 1 },
	backButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 15,
		marginRight: 16,
		position: 'absolute',
		left: 15,
	},
	namesBot: {},
	namesTop: {},
	namesSticky: {
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		paddingBottom: 5
	},
	main: { flex: 1 }
});

export const UserLogo = React.memo(UserLogoComponent, (prevProps, nextProps) => {
	const prevSource = typeof prevProps.source === 'string' ? prevProps.source : JSON.stringify(prevProps.source);
	const nextSource = typeof nextProps.source === 'string' ? nextProps.source : JSON.stringify(nextProps.source);

	return (
		prevSource === nextSource &&
		prevProps.size === nextProps.size &&
		prevProps.bordered === nextProps.bordered &&
		prevProps.loading === nextProps.loading &&
		prevProps.isMe === nextProps.isMe &&
		prevProps.isOnline === nextProps.isOnline &&
		prevProps.canvas === nextProps.canvas &&
		prevProps.streakCount === nextProps.streakCount &&
		prevProps.bgImage === nextProps.bgImage &&
		prevProps.selectedChat === nextProps.selectedChat
	);
});

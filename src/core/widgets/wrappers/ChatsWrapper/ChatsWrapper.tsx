import { BgWrapperUi, Box, MainText, PageHeaderUi, SimpleButtonUi } from '@core/ui';
import { BlurView } from 'expo-blur';
import { observer } from 'mobx-react-lite';
import { Dispatch, JSX, ReactNode, SetStateAction, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlexAlignType, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { themeStore } from 'src/modules/theme/stores';

interface ChatsWrapperProps {
	tKey?: string;
	children?: JSX.Element;
	PageHeaderUiStyle?: StyleProp<ViewStyle>;
	wrapperStyle?: StyleProp<ViewStyle>;
	bgWrapperStyle?: StyleProp<ViewStyle>;
	cancelText?: boolean;
	readyText?: boolean;
	midJsx?: ReactNode | null;
	bottomJsx?: ReactNode | null;
	rightJsx?: ReactNode | null;
	transparentSafeArea?: boolean;
	headerHeight?: number;
	rightTop?: number;
	additionalJsx?: ReactNode | null;
	leftTop?: number;
	scrollEnabled?: boolean;
	wrapperJustifyContent?: FlexAlignType;
	icon?: ReactNode;
	Component?: any;
	loading?: "nointernet" | "pending" | "fulfilled" | "error";
	isBlurView?: boolean;
	bottomStyle?: StyleProp<ViewStyle>;
	bottomInsenity?: number;
	topIntensity?: number;
	topBottomBgColor?: string;
	requiredBg?: boolean;
	onBackPress?: () => void;
	onSuccessPress?: () => void;
	midPress?: () => void;
	bottomHeight?: number;
	setBottomHeight?: Dispatch<SetStateAction<number>>;
	bottomTransparent?: boolean;
	noBg?: boolean;
	noSafeZone?: boolean;
}

export const ChatsWrapper = observer(({
	tKey,
	children,
	additionalJsx,
	PageHeaderUiStyle = {},
	noBg = false,
	wrapperStyle = {},
	bgWrapperStyle = {},
	headerHeight = 30,
	midPress,
	cancelText = false,
	bottomTransparent = true,
	rightTop = 0,
	isBlurView = true,
	Component = BlurView,
	leftTop = 0,
	readyText = false,
	bottomHeight = 0,
	setBottomHeight,
	topBottomBgColor = themeStore.currentTheme.bg_100,
	transparentSafeArea = false,
	wrapperJustifyContent = "flex-start",
	midJsx = null,
	rightJsx = null,
	scrollEnabled = true,
	bottomJsx = null,
	loading = "pending",
	bottomStyle = {},
	bottomInsenity = 30,
	topIntensity = 30,
	requiredBg = true,
	icon,
	onBackPress,
	onSuccessPress,
	noSafeZone = false,
}: ChatsWrapperProps) => {
	const { currentTheme } = themeStore;

	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const [safeZoneHeight, setSafeZoneHeight] = useState(0);
	const onSafeZoneHeight = useCallback((h: number) => setSafeZoneHeight(h), []);

	if (transparentSafeArea) return (
		<BgWrapperUi
			style={bgWrapperStyle}
			requiredBg={requiredBg}
			useBg={!noBg}
		>
			<PageHeaderUi
				text={t(tKey || "")}
				Component={BlurView}
				loading={loading}
				isBlurView={isBlurView}
				height={headerHeight}
				leftTop={leftTop}
				rightTop={rightTop}
				midPress={midPress}
				icon={icon}
				intensity={topIntensity}
				wrapperJustifyContent={wrapperJustifyContent}
				style={[
					{ backgroundColor: topBottomBgColor },
					PageHeaderUiStyle,
				]}
				midJsx={midJsx}
				additionalJsx={additionalJsx}
				noSafeZone={noSafeZone}
				onSafeZoneHeight={onSafeZoneHeight}
				cancelText={cancelText ? t('cancel') : ""}
				leftJsx={cancelText && (
					<SimpleButtonUi onPress={onBackPress}>
						<MainText
							fontWeight='bold'
							color={currentTheme.primary_100}
						>
							{t('cancel')}
						</MainText>
					</SimpleButtonUi>
				)}
				rightJsx={rightJsx ? (<>{rightJsx}</>) : readyText && (
					<SimpleButtonUi onPress={onSuccessPress}>
						<MainText
							fontWeight='bold'
							color={currentTheme.primary_100}
						>
							{t('ready')}
						</MainText>
					</SimpleButtonUi>
				)}
			/>

			{scrollEnabled ? (
				<ScrollView
					style={[
						s.wrapper,
						wrapperStyle,
						{ marginTop: !noSafeZone ? safeZoneHeight : 0 },
					]}
					scrollEnabled={false}
				>
					<View style={{ paddingBottom: bottomHeight + 5 }}>
						{children ? children : (
							<MainText primary px={30}>
								Empty Children
							</MainText>
						)}
					</View>
				</ScrollView>
			) : (
				<View style={{ marginTop: !noSafeZone ? safeZoneHeight : 0, flex: 1 }}>
					{children ? children : (
						<MainText primary px={30}>
							Empty Children
						</MainText>
					)}
				</View>
			)}

			{(bottomJsx && !bottomTransparent) && (
				<BlurView
					intensity={bottomInsenity}
					onLayout={(e) => {
						if (!setBottomHeight) return;
						setBottomHeight(e.nativeEvent.layout.height);
					}}
					style={[
						{
							backgroundColor: topBottomBgColor,
							paddingBottom: insets.bottom,
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
						},
						bottomStyle
					]}
				>
					{bottomJsx}
				</BlurView>
			)}
			{(bottomJsx && bottomTransparent) && (
				<Box
					onLayout={(e) => {
						if (setBottomHeight) setBottomHeight(e.nativeEvent.layout.height);
					}}
					style={[
						{
							paddingBottom: insets.bottom,
							backgroundColor: "transparent",
							pointerEvents: 'box-none' as const,
						},
						bottomStyle,
					]}
				>
					{bottomJsx}
				</Box>
			)}
		</BgWrapperUi>
	);

	return (
		<BgWrapperUi style={bgWrapperStyle}>
			<PageHeaderUi
				isBlurView={isBlurView}
				loading={loading}
				height={headerHeight}
				leftTop={leftTop}
				rightTop={rightTop}
				icon={icon}
				Component={Component}
				intensity={topIntensity}
				wrapperJustifyContent={wrapperJustifyContent}
				text={t(tKey || "")}
				style={[
					PageHeaderUiStyle
				]}
				noSafeZone={noSafeZone}
				onSafeZoneHeight={onSafeZoneHeight}
				cancelText={cancelText ? t('cancel') : ""}
				leftJsx={cancelText && (
					<SimpleButtonUi onPress={onBackPress}>
						<MainText
							fontWeight='bold'
							color={currentTheme.primary_100}
						>
							{t('cancel')}
						</MainText>
					</SimpleButtonUi>
				)}
				midJsx={midJsx}
				rightJsx={rightJsx ? (<>{rightJsx}</>) : readyText ? (
					<SimpleButtonUi onPress={onSuccessPress}>
						<MainText
							fontWeight='bold'
							color={currentTheme.primary_100}
						>
							{t('ready')}
						</MainText>
					</SimpleButtonUi>
				) : <></>}
			/>

			<View
				style={[
					s.wrapper,
					wrapperStyle,
					{ paddingBottom: bottomHeight + 5, marginTop: !noSafeZone ? safeZoneHeight : 0 },
				]}
			>
				{children ? children : (
					<MainText primary px={30}>
						Empty Children
					</MainText>
				)}
			</View>

			{bottomJsx && (
				<BlurView
					intensity={bottomInsenity}
					onLayout={(e) => {
						if (!setBottomHeight) return;
						setBottomHeight(e.nativeEvent.layout.height);
					}}
					style={[
						{
							backgroundColor: currentTheme.bg_100,
							paddingBottom: insets.bottom,
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
						},
						bottomStyle
					]}
				>
					{bottomJsx}
				</BlurView>
			)}
		</BgWrapperUi>
	);
});

const s = StyleSheet.create({
	wrapper: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 10,
		flexDirection: 'column',
		gap: 15,
	},
});
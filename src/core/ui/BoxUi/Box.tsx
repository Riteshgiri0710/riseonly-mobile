import { pxNative } from '@lib/theme';
import { observer } from 'mobx-react-lite';
import { ReactNode } from 'react';
import { DimensionValue, StyleProp, View, ViewProps, ViewStyle } from 'react-native';

export const Box = observer(({
	children,
	bRad = 0,
	centered = false,
	flex,
	flexShrink,
	bgColor = 'transparent',
	bBotColor = 'transparent',
	overflow = 'visible',
	display = undefined,
	borderWidth = 0,
	borderColor = 'transparent',
	fD,
	minHeight,
	position,
	bBotWidth = 0,
	padding,
	align = "flex-start",
	justify = "flex-start",
	margin,
	width,
	minWidth,
	height,
	gap = 0,
	mB = 0,
	style,
	debug = false,
	...rest
}: BoxProps) => {
	return (
		<View
			style={[
				{
					display: display,
					borderRadius: pxNative(bRad),
					backgroundColor: bgColor as string,
					gap: gap,
					flex: flex,
					flexShrink: flexShrink,
					padding: padding,
					margin: margin,
					width: width,
					minWidth: minWidth,
					height: height,
					minHeight: minHeight,
					justifyContent: centered ? 'center' : justify,
					alignItems: centered ? 'center' : align,
					borderBottomWidth: bBotWidth,
					borderBottomColor: bBotColor,
					flexDirection: fD,
					position,
					marginBottom: mB,
					overflow: overflow,
				},
				borderColor && {
					borderWidth: borderWidth,
					borderColor: borderColor,
				},
				debug && {
					borderWidth: 0.2,
					borderColor: "red"
				},
				style,
			]}
			{...rest}
		>
			{children}
		</View>
	);
});

type BoxProps = ViewProps & {
	mB?: number;
	children?: ReactNode;
	debug?: boolean;
	bRad?: number | string;
	centered?: boolean;
	flex?: number;
	flexShrink?: number;
	bgColor?: string | undefined | number;
	gap?: number;
	minHeight?: DimensionValue;
	padding?: number;
	margin?: number;
	width?: DimensionValue;
	height?: DimensionValue;
	minWidth?: DimensionValue;
	style?: StyleProp<ViewStyle>;
	bBotColor?: string;
	align?: "center" | "flex-start" | "flex-end" | undefined;
	justify?: "center" | "flex-start" | "flex-end" | "space-between" | undefined | "space-around";
	bBotWidth?: number;
	display?: 'flex' | 'none' | undefined;
	fD?: "column" | "row" | undefined;
	position?: "absolute" | "relative" | "static" | undefined;
	overflow?: "visible" | "hidden" | "scroll" | undefined;
	borderWidth?: number;
	borderColor?: string;
};
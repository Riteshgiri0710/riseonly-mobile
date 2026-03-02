import { Box, MainText } from '@core/ui';
import { ChatType } from '@modules/chat/stores/chats';
import { TypingResponse } from '@modules/chat/stores/message';
import { themeStore } from '@modules/theme/stores';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DimensionValue } from 'react-native';
import Animated, {
	Easing,
	cancelAnimation,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

export const TypingAnimation = ({
	color = "",
	width = 10,
	fontSize = 32,
	typing_datas,
	type,
	height = '100%',
	leftText,
	isChat = false,
}: TypingAnimationProps) => {
	const { currentTheme } = themeStore;

	const { t } = useTranslation();

	const dots = [0, 1, 2];

	const dotValues = [
		useSharedValue(0),
		useSharedValue(0),
		useSharedValue(0),
	];

	React.useEffect(() => {
		dotValues.forEach((dotValue, index) => {
			cancelAnimation(dotValue);

			dotValue.value = 0;
			dotValue.value = withDelay(
				index * 200,
				withRepeat(
					withSequence(
						withTiming(1, {
							duration: 500,
							easing: Easing.inOut(Easing.ease)
						}),
						withTiming(0, {
							duration: 500,
							easing: Easing.inOut(Easing.ease)
						})
					),
					-1,
					false
				)
			);
		});

		return () => {
			dotValues.forEach(dotValue => {
				cancelAnimation(dotValue);
			});
		};
	}, []);

	return (
		<Box
			fD='row'
			align='flex-end'
			gap={2}
		>
			{(leftText && !isChat) && leftText}

			{(isChat && typing_datas && typing_datas.length > 0) && (
				<MainText
					numberOfLines={2}
					ellipsizeMode="tail"
					px={12.5}
					color={currentTheme.primary_100}
				>
					{(() => {
						const typingUsers = typing_datas.map(t => t.user_name);

						if (typingUsers.length === 1 && type === "PRIVATE") {
							return t("typing.private");
						}

						if (typingUsers.length === 1) {
							return t("typing.one", { user: typingUsers[0] });
						} else if (typingUsers.length === 2) {
							return t("typing.two", { user1: typingUsers[0], user2: typingUsers[1] });
						} else {
							return t("typing.many", { user1: typingUsers[0], count: typingUsers.length - 1 });
						}
					})()}
				</MainText>
			)}

			<Box
				fD='row'
			>
				{dots.map((_, index) => {
					const dotStyle = useAnimatedStyle(() => {
						return {
							transform: [
								{
									translateY: -2 * dotValues[index].value
								},
								{
									scale: 1 + 0.2 * dotValues[index].value
								}
							],
							opacity: 0.6 + 0.4 * dotValues[index].value
						};
					});

					return (
						<Animated.Text
							key={index}
							style={[
								{
									fontSize,
									color: color || currentTheme.primary_100,
									width,
									height,
									marginBottom: 4
								},
								dotStyle
							]}
						>
							•
						</Animated.Text>
					);
				})}
			</Box>
		</Box>
	);
};

interface TypingAnimationProps {
	color?: string;
	width?: DimensionValue;
	height?: DimensionValue;
	fontSize?: number;
	leftText?: ReactNode;
	isChat?: boolean;
	typing_datas?: TypingResponse[];
	type?: ChatType;
}

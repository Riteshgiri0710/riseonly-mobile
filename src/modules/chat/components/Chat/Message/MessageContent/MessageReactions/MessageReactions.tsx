import { Box, MainText, PressableUi, UserLogo } from '@core/ui';
import { darkenRGBA, oppositeColor } from '@lib/theme';
import { chatsInteractionsStore } from '@modules/chat/stores/chats';
import { messageInteractionsStore } from '@modules/chat/stores/message';
import { reactionsInteractionsStore } from '@modules/chat/stores/reactions';
import { GetMessageMessage } from '@modules/chat/stores/message/message-actions/types';
import { themeStore } from '@modules/theme/stores';
import { profileStore } from '@modules/user/stores/profile';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { formatCommentCount } from '@lib/numbers';

const PULSE_SCALE = 1.6;
const PULSE_DURATION_MS = 600;
const PULSE_UP_MS = PULSE_DURATION_MS / 2;
const PULSE_DOWN_MS = PULSE_DURATION_MS / 2;

interface MessageReactionsProps {
	message: GetMessageMessage;
	chatEnterKey?: number;
}

export const MessageReactions = observer(({
	message,
	chatEnterKey = 0,
}: MessageReactionsProps) => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const { selectedChat } = chatsInteractionsStore;
	const { markReactionsAsReadForMessage } = messageInteractionsStore;
	const { reactionPressHandler } = reactionsInteractionsStore;

	const scaleValue = useSharedValue(1);

	useEffect(() => {
		if (!message.reactions_unreaded) return;
		const hasReactionFromSomeoneElse = message.reacted_by?.some((r) => r.sender?.id !== profile?.id);
		if (!hasReactionFromSomeoneElse) return;

		markReactionsAsReadForMessage(message);

		const rafId = requestAnimationFrame(() => {
			scaleValue.value = withSequence(
				withTiming(PULSE_SCALE, { duration: PULSE_UP_MS }),
				withTiming(1, { duration: PULSE_DOWN_MS }),
			);
		});
		return () => cancelAnimationFrame(rafId);
	}, [message.id, message.reactions_unreaded, chatEnterKey]);

	const reactions = message.reactions ?? [];
	const reactedBy = message.reacted_by ?? [];
	const totalReactionsCount = useMemo(
		() => reactions.reduce((acc, r) => acc + r.count, 0),
		[reactions],
	);
	const animatedReactionStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scaleValue.value }],
	}), []);

	if (!message.has_reactions) return null;

	const containerStyle = useMemo(() => ({ marginTop: 3, flexWrap: 'wrap' as const }), []);

	return (
		<Box
			style={containerStyle}
			fD='row'
			gap={4}
		>
			{reactions.map((reaction) => {
				const reactors = reactedBy.filter((r) => r.reaction === reaction.reaction);
				const reactedByYou = typeof reaction.reacted_by_you === 'boolean'
					? reaction.reacted_by_you
					: reactors.some((r) => r.sender?.id === profile?.id);
				const showAvatars = totalReactionsCount < 3 && reaction.count < 3;
				const avatarSources = showAvatars ? reactors.slice(0, 3).map((r) => r.sender?.more?.logo) : [];
				const isYourMessage = message.sender?.id === profile?.id;
				let backgroundColor = "";
				let countColor = "";

				if (!reactedByYou) backgroundColor = "rgba(0, 0, 0, 0.2)";
				else if (isYourMessage) backgroundColor = currentTheme.text_100;
				else backgroundColor = darkenRGBA(currentTheme.primary_100, 0.2);

				if (!reactedByYou) countColor = currentTheme.text_100;
				else if (isYourMessage) countColor = oppositeColor(currentTheme.text_100);
				else countColor = currentTheme.primary_100;

				return (
					<PressableUi
						key={reaction.reaction}
						style={[
							s.reaction,
							{
								backgroundColor,
								borderRadius: 1000,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 5,
							},
						]}
						onPress={() => {
							if (selectedChat) {
								reactionPressHandler(reaction.reaction, selectedChat, reactedByYou, message);
							}
						}}
					>
						<Animated.View
							style={[
								animatedReactionStyle,
								s.emojiRow,
								{ gap: showAvatars ? 3 : 2 }
							]}
						>
							<MainText px={20}>
								{reaction.reaction}
							</MainText>
							<Box
								fD='row'
							>
								{showAvatars &&
									avatarSources.map((logo, idx) => (
										<UserLogo
											key={`${reaction.reaction}-${idx}-${reactors[idx]?.sender?.id ?? idx}`}
											source={logo}
											size={25}
											style={[s.avatar, { borderColor: currentTheme.border_100, marginLeft: idx > 0 ? (-25 / 2) : 0 }]}
										/>
									))
								}
							</Box>

							{!showAvatars && (
								<MainText
									color={countColor}
									px={14}
									style={{ marginRight: 3, marginTop: 1 }}
								>
									{formatCommentCount(reaction.count, null, false)}
								</MainText>
							)}
						</Animated.View>
					</PressableUi>
				);
			})}
		</Box>
	);
});

const s = StyleSheet.create({
	reaction: {
		paddingVertical: 3,
		paddingHorizontal: 8,
		paddingRight: 9,
	},
	emojiRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	avatar: {
		borderWidth: 0.3,
	},
	count: {
		fontWeight: '500',
	},
});
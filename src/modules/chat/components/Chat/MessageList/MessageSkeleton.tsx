import { themeStore } from '@modules/theme/stores';
import { observer } from 'mobx-react-lite';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

const SKELETON_COUNT = 10;
const AVATAR_SIZE = 35;
const BUBBLE_MIN_HEIGHT = 44;
const BUBBLE_MAX_WIDTH = 280;
const replyCircleView = 50;

const LeftBubbleSkeleton = observer(() => {
	const { currentTheme } = themeStore;
	return (
		<View
			style={[
				styles.bubble,
				styles.leftBubble,
				{ backgroundColor: currentTheme.bg_200 ?? 'rgba(40,40,40,0.6)' },
			]}
		/>
	);
});

const RightBubbleSkeleton = observer(() => {
	const { currentTheme } = themeStore;
	const bg = (currentTheme as { bg_300?: string; }).bg_300 ?? currentTheme.bg_200 ?? 'rgba(35,35,35,0.8)';
	return (
		<View style={[styles.bubble, styles.rightBubble, { backgroundColor: bg }]} />
	);
});

interface MessageSkeletonRowProps {
	align: 'left' | 'right';
}

export const MessageSkeletonRow = memo(({ align }: MessageSkeletonRowProps) => {
	const { currentTheme } = themeStore;
	const isRight = align === 'right';

	return (
		<View style={[styles.row, isRight && styles.rowRight]}>
			{!isRight && (
				<View
					style={[
						styles.avatar,
						{ backgroundColor: currentTheme.bg_200 ?? 'rgba(40,40,40,0.6)' },
					]}
				/>
			)}
			{isRight ? <RightBubbleSkeleton /> : <LeftBubbleSkeleton />}
			{isRight && <View style={styles.avatarPlaceholder} />}
		</View>
	);
});

export const MessageSkeletonList = observer(() => {
	return (
		<View style={styles.container} pointerEvents="none">
			{Array.from({ length: SKELETON_COUNT }, (_, i) => (
				<MessageSkeletonRow
					key={i}
					align={i % 3 === 0 ? 'right' : 'left'}
				/>
			))}
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: replyCircleView,
		paddingTop: 16,
		paddingBottom: 24,
		justifyContent: 'flex-end',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 5,
		marginBottom: 6,
		marginLeft: -47,
	},
	rowRight: {
		justifyContent: 'flex-end',
		marginLeft: 0,
		marginRight: -replyCircleView,
		paddingRight: 5,
	},
	avatar: {
		width: AVATAR_SIZE,
		height: AVATAR_SIZE,
		borderRadius: AVATAR_SIZE / 2,
	},
	avatarPlaceholder: {
		width: AVATAR_SIZE,
	},
	bubble: {
		minHeight: BUBBLE_MIN_HEIGHT,
		maxWidth: BUBBLE_MAX_WIDTH,
		borderRadius: 20,
		width: '70%',
	},
	leftBubble: {
		borderTopLeftRadius: 4,
	},
	rightBubble: {
		borderTopRightRadius: 4,
	},
});

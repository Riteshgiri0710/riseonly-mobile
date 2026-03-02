import { observer } from 'mobx-react-lite';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { themeStore } from 'src/modules/theme/stores';

interface ScrollToMentionButtonProps {
	visible: boolean;
	onPress: () => void;
	bottomOffset?: number;
	mentionCount?: number;
}

export const ScrollToMentionButton = observer(({ visible, onPress, bottomOffset = 130, mentionCount = 0 }: ScrollToMentionButtonProps) => {
	const { currentTheme } = themeStore;

	if (!visible) return null;

	return (
		<Animated.View
			entering={FadeIn.duration(200)}
			exiting={FadeOut.duration(200)}
			style={[
				styles.container,
				{
					backgroundColor: currentTheme.bg_200,
					bottom: bottomOffset,
					borderColor: currentTheme.border_100,
					borderWidth: 1,
				}
			]}
		>
			<TouchableOpacity
				onPress={onPress}
				style={styles.button}
				activeOpacity={0.7}
			>
				<Icon name="alternate-email" size={24} color={currentTheme.text_100} />
				{mentionCount > 0 && (
					<View style={[styles.badge, { backgroundColor: currentTheme.primary_100 }]}>
						<Text style={styles.badgeText}>{mentionCount > 99 ? '99+' : mentionCount}</Text>
					</View>
				)}
			</TouchableOpacity>
		</Animated.View>
	);
});

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 10,
		width: 40,
		height: 40,
		borderRadius: 1000,
		justifyContent: 'center',
		alignItems: 'center',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
		zIndex: 1000,
	},
	button: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	badge: {
		position: 'absolute',
		top: -5,
		right: -5,
		minWidth: 18,
		height: 18,
		borderRadius: 9,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 4,
	},
	badgeText: {
		color: 'white',
		fontSize: 10,
		fontWeight: 'bold',
	},
});

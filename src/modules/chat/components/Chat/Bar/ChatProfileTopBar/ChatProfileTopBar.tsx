import { Box, SimpleButtonUi } from '@core/ui';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@lib/navigation';
import { themeStore } from '@modules/theme/stores';
import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Extrapolate, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { ChatTitle } from '../../ChatTitle/ChatTitle';

interface ChatProfileTopBarProps {
	scrollY: Animated.SharedValue<number>;
}

export const ChatProfileTopBar = observer(({
	scrollY
}: ChatProfileTopBarProps) => {
	const {
		safeAreaWithContentHeight: { safeAreaWithContentHeight },
		currentTheme
	} = themeStore;

	const route = useRoute<"ChatProfile">();
	const { selectedChat } = route.params;

	const navigation = useNavigation();

	const onBackPress = () => navigation.goBack();

	const stickyHeaderStyle = useAnimatedStyle(() => {
		'worklet';
		const scrollValue = scrollY.value;
		return {
			opacity: interpolate(scrollValue, [30, 60], [0, 1], Extrapolate.CLAMP),
		};
	}, [scrollY]);

	const floatingBackButtonStyle = useAnimatedStyle(() => {
		return {
			opacity: 1,
			pointerEvents: 'auto',
		};
	}, []);

	const stickyHeaderContainerStyle = useMemo(() => [
		s.stickyHeader,
		{
			position: 'absolute' as const,
			top: 0,
			left: 0,
			right: 0,
			zIndex: 1000,
			paddingTop: safeAreaWithContentHeight,
			backgroundColor: currentTheme.bg_200,
			borderBottomColor: currentTheme.border_100,
		}
	], [safeAreaWithContentHeight, currentTheme.bg_200, currentTheme.border_100]);

	const floatingBackButtonContainerStyle = useMemo(() => [
		{
			position: 'absolute' as const,
			top: safeAreaWithContentHeight - 5,
			left: 5,
			zIndex: 10002,
		},
		floatingBackButtonStyle,
	], [safeAreaWithContentHeight, floatingBackButtonStyle]);

	return (
		<>
			<Animated.View
				style={floatingBackButtonContainerStyle}
			>
				<SimpleButtonUi
					onPress={onBackPress}
					style={s.backBtn}
					activeOpacity={0.7}
				>
					<Ionicons
						name="chevron-back"
						size={28}
						color={currentTheme.primary_100}
					/>
				</SimpleButtonUi>
			</Animated.View>

			<Animated.View
				style={[stickyHeaderContainerStyle, stickyHeaderStyle]}
				pointerEvents="box-none"
			>
				<Box style={{ width: 40 }} />

				<Box style={s.centerContent}>
					<ChatTitle
						chat={selectedChat}
						usernamePx={14}
						titlePx={14}
						favPx={14}
						fontWeight="normal"
					/>
				</Box>

				<Box style={{ width: 40 }} />
			</Animated.View>
		</>
	);
});

const s = StyleSheet.create({
	stickyHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderBottomWidth: 0.3,
	},
	backBtn: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	centerContent: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
});
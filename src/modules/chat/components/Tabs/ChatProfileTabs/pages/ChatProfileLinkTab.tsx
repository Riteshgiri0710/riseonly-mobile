import { InDevUi, useParentScroll } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { chatsInteractionsStore } from 'src/modules/chat/stores/chats';

export const ChatProfileLinkTab = observer(() => {
	const useParent = useParentScroll();
	const {
		isTabScrollEnabled: { isTabScrollEnabled, setIsTabScrollEnabled },
		isMainScrollEnabled: { setIsMainScrollEnabled },
		scrollMomentum: { scrollMomentum },
	} = chatsInteractionsStore;

	const scrollY = useSharedValue(0);
	const scrollRef = useRef<Animated.ScrollView>(null);

	useEffect(() => {
		if (!useParent && scrollMomentum > 0 && isTabScrollEnabled && scrollRef.current) {
			console.log(")");
			const displacement = Math.min(scrollMomentum * 0.1, 200);
			scrollRef.current.scrollTo({ y: displacement, animated: true });
		}
	}, [scrollMomentum, isTabScrollEnabled, useParent]);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			if (useParent) return;
			scrollY.value = event.contentOffset.y;
			if (scrollY.value <= 0) {
				runOnJS(setIsTabScrollEnabled)(false);
				runOnJS(setIsMainScrollEnabled)(true);
			}
		},
	});

	if (useParent) {
		return (
			<View style={{ flexGrow: 1 }}>
				<InDevUi />
			</View>
		);
	}

	return (
		<Animated.ScrollView
			ref={scrollRef}
			scrollEnabled={isTabScrollEnabled}
			onScroll={scrollHandler}
			scrollEventThrottle={16}
			bounces={false}
		>
			<InDevUi />
		</Animated.ScrollView>
	);
});
import { AsyncDataRender, BgWrapperUi } from '@core/ui';
import { useFocusEffect, useRoute } from '@lib/navigation';
import { observer } from 'mobx-react-lite';
import { useCallback, useRef } from 'react';
import { Animated as AnimatedRn, StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReportsSheet } from 'src/modules/report/widgets/bottomsheets';
import { themeStore } from 'src/modules/theme/stores';
import { ProfileContent, ProfileTop } from 'src/modules/user/components';
import { profileActionsStore, profileStore } from 'src/modules/user/stores/profile';

interface ProfileProps { isUser?: boolean; }

export const Profile = observer(({
  isUser = false
}: ProfileProps) => {
  const { mainBottomNavigationHeight } = themeStore;
  const {
    myProfile: {
      status,
      options
    },
    user,
    getMyProfile,
    getUserAction
  } = profileActionsStore;
  const {
    profile,
    handleScroll
  } = profileStore;

  let tag = profile?.tag || "";
  try {
    const route = useRoute();
    if (route?.params && typeof route.params === 'object' && 'tag' in route.params) {
      tag = (route.params as any).tag;
    }
  } catch (error) {
    console.log('🔧 Profile: Using profile tag instead of route params');
  }

  const progress = useRef(new AnimatedRn.Value(0)).current;
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      if (isUser) {
        getUserAction(tag);
        return;
      }
      getMyProfile(true, tag, (isUser || false));
    }, [tag, isUser])
  );

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      if (handleScroll) runOnJS(handleScroll)(event, progress);
    }
  });

  const animatedBannerStyle = useAnimatedStyle(() => ({
    width: '100%',
    height: 200,
  }));

  return (
    <BgWrapperUi>
      <View style={styles.mainContainer}>
        <Animated.ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContentContainer,
            { paddingBottom: insets.bottom + mainBottomNavigationHeight }
          ]}
          bounces={false}
          scrollEventThrottle={16}
          onScroll={scrollHandler}
          overScrollMode="auto"
        >
          <AsyncDataRender
            status={isUser ? user?.status || 'fulfilled' : status || 'fulfilled'}
            data={isUser ? user : profile}
            needPending={isUser ? user?.options?.needPending : options?.needPending}
            renderContent={() => (
              <View style={styles.container}>
                <ProfileTop
                  animatedBannerStyle={animatedBannerStyle}
                  isUser={isUser}
                />
                <ProfileContent />
              </View>
            )}
          />
        </Animated.ScrollView>

        <ReportsSheet />
      </View>
    </BgWrapperUi>
  );
});

const styles = StyleSheet.create({
  img: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    position: 'relative'
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    gap: 10,
  }
});

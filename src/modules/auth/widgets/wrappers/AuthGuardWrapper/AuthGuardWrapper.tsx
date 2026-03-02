import { LogoAnimation } from '@animations/components/LogoAnimation';
import { Box } from '@core/ui';
import { observer } from "mobx-react-lite";
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { authServiceStore, authStore } from 'src/modules/auth/stores';
import { themeStore } from 'src/modules/theme/stores';

export const AuthGuardWrapper = observer(({ children }: { children: React.ReactNode; }) => {
	const { currentTheme } = themeStore;
	const {
		appReady: { setAppReady },
		splashScreen: { splashScreen, setSplashScreen },
		initialScreen: { setInitialScreen },
		initAppHandler
	} = authStore;
	const { checkAuth } = authServiceStore;

	useEffect(() => {
		initAppHandler();
	}, []);

	if (!__DEV__ && splashScreen) {
		// if (splashScreen) {
		return (
			<Box
				style={[
					styles.splashContainer,
					{ backgroundColor: currentTheme.bg_100 }
				]}
			>
				<LogoAnimation
					size={300}
					autoPlay={true}
					loop={false}
					onAnimationFinish={() => setSplashScreen(false)}
					animationDuration={3000}
				/>
			</Box>
		);
	}

	return children;
});

const styles = StyleSheet.create({
	splashContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	}
});
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { View } from 'react-native';
import { DefaultTheme, PaperProvider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { themeStore } from 'src/modules/theme/stores';

export const ThemeInitWrapper = observer(({ children }: { children: React.ReactNode; }) => {
	const {
		safeAreaWithContentHeight: { setSafeAreaWithContentHeight },
		currentTheme
	} = themeStore;

	const insets = useSafeAreaInsets();

	useEffect(() => {
		if (insets.top == 0 || !insets.top) return;
		const height = insets.top;
		setSafeAreaWithContentHeight(height);
	}, [insets]);

	return (
		<PaperProvider
			theme={{
				...DefaultTheme,
				colors: {
					...DefaultTheme.colors,
					onSurfaceVariant: currentTheme.secondary_100,
					background: currentTheme.bg_200,
					primary: currentTheme.primary_100,
					onBackground: currentTheme.input_bg_300,
					outline: currentTheme.input_border_300,
				},
			}}
		>
			<View
				style={{
					flex: 1,
					backgroundColor: currentTheme.bg_200
				}}
			>
				{children}
			</View>
		</PaperProvider>
	);
});
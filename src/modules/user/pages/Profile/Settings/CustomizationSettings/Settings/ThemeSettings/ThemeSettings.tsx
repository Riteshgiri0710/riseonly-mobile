import { Box, MainText } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from "mobx-react-lite";
import { themeActionsStore } from 'src/modules/theme/stores';

export const ThemeSettings = observer(() => {
	const { } = themeActionsStore;

	return (
		<ProfileSettingsWrapper
			tKey='settings_customization_your_theme'
			height={45}
		>
			<Box flex={1} height={"100%"}>
				<MainText>Your themes</MainText>
			</Box>
		</ProfileSettingsWrapper>
	);
});
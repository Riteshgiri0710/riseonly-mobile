import { Box, MainText } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from "mobx-react-lite";
import { themeActionsStore } from 'src/modules/theme/stores';

export const ChatWallpapersSettings = observer(() => {
	const { } = themeActionsStore;

	return (
		<ProfileSettingsWrapper
			tKey='settings_customization_chat_wallpapers'
			height={45}
		>
			<Box flex={1} height={"100%"}>
				<MainText>Your chat wallpapers</MainText>
			</Box>
		</ProfileSettingsWrapper>
	);
});
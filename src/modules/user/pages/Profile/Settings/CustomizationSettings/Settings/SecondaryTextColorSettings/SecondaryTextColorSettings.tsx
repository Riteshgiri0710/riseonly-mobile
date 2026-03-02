import { CustomizationPreviewContent } from '@config/tsx';
import { Box, ButtonUi, MainText, SimpleButtonUi } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from "mobx-react-lite";
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { themeActionsStore, themeStore } from 'src/modules/theme/stores';

export const SecondaryTextColorSettings = observer(() => {
	const { } = themeActionsStore;
	const {
		colorBottomSheet: { setColorBottomSheet },
		currentTheme,
		changeToDefault,
	} = themeStore;

	const { t } = useTranslation();

	return (
		<ProfileSettingsWrapper
			tKey='settings_secondary_text_color'
			height={45}
		>
			<Box
				flex={1}
				height={"100%"}
				gap={15}
			>
				<CustomizationPreviewContent t={t} s={s} />

				<Box
					gap={5}
					fD='row'
				>
					<SimpleButtonUi
						style={s.btn}
						height={35}
						bRad={10}
						bgColor={currentTheme.btn_bg_300}
						onPress={() => changeToDefault()}
					>
						<MainText tac='center'>
							{t('return_text')}
						</MainText>
					</SimpleButtonUi>

					<ButtonUi
						onPress={() => setColorBottomSheet(true)}
						height={35}
						bRad={10}
						style={{ ...s.btn }}
					>
						<MainText tac='center'>
							{t('edit_text')}
						</MainText>
					</ButtonUi>
				</Box>
			</Box>
		</ProfileSettingsWrapper>
	);
});

const s = StyleSheet.create({
	btn: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center"
	}
});


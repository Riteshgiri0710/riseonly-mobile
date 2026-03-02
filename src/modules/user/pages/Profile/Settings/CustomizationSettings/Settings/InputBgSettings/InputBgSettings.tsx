import { CustomizationPreviewContent } from '@config/tsx';
import { Box, ButtonUi, MainText, SimpleButtonUi } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from "mobx-react-lite";
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

export const InputBgSettings = observer(() => {
	const {
		colorBottomSheet: { setColorBottomSheet },
		currentTheme,
		defaultTheme,
		setThemeValue
	} = themeStore;

	const { t } = useTranslation();

	const handleReset = () => setThemeValue('input_bg_300', defaultTheme.input_bg_300);

	return (
		<ProfileSettingsWrapper
			tKey='settings_input_bg'
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
						onPress={handleReset}
					>
						<MainText>
							{t('return_text')}
						</MainText>
					</SimpleButtonUi>

					<ButtonUi
						onPress={() => setColorBottomSheet(true)}
						height={35}
						bRad={10}
						style={s.btn}
					>
						<MainText>
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

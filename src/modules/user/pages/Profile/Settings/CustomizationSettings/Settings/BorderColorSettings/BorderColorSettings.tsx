import { CustomizationPreviewContent } from '@config/tsx';
import { Box, ButtonUi, MainText, SimpleButtonUi } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from "mobx-react-lite";
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

export const BorderColorSettings = observer(() => {
	const {
		colorBottomSheet: { setColorBottomSheet },
		currentTheme,
		defaultTheme,
		setThemeValue
	} = themeStore;

	const { t } = useTranslation();

	const handleReset = () => setThemeValue('border_100', defaultTheme.border_100);

	return (
		<ProfileSettingsWrapper
			tKey='settings_border_color'
			height={45}
		>
			<Box flex={1} height={"100%"} gap={15}>
				<CustomizationPreviewContent t={t} s={styles} />

				<Box gap={5} fD='row'>
					<SimpleButtonUi
						style={styles.btn}
						height={35}
						bRad={10}
						bgColor={currentTheme.btn_bg_300}
						onPress={handleReset}
					>
						<MainText>{t('return_text')}</MainText>
					</SimpleButtonUi>

					<ButtonUi
						onPress={() => setColorBottomSheet(true)}
						height={35}
						bRad={10}
						style={styles.btn}
					>
						<MainText>{t('edit_text')}</MainText>
					</ButtonUi>
				</Box>
			</Box>
		</ProfileSettingsWrapper>
	);
});

const styles = StyleSheet.create({
	btn: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center"
	}
});


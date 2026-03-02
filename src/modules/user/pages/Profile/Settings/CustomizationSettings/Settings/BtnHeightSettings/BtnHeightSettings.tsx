import { CustomizationPreviewContent } from '@config/tsx';
import { Box, MainText, SimpleButtonUi, ValuePicker } from '@core/ui';
import { pxNative } from '@lib/theme';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from "mobx-react-lite";
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

export const BtnHeightSettings = observer(() => {
	const { currentTheme, setThemeValue, defaultTheme } = themeStore;
	const { t } = useTranslation();

	const heightValues = [30, 35, 40, 45, 50, 55, 60];
	const currentHeight = pxNative(currentTheme.btn_height_300);

	const handleChange = (value: number) => setThemeValue('btn_height_300', `${value}px`);
	const handleReset = () => setThemeValue('btn_height_300', defaultTheme.btn_height_300);

	return (
		<ProfileSettingsWrapper
			tKey='settings_btn_height'
			height={45}
		>
			<Box
				flex={1}
				height={"100%"}
				gap={15}
			>
				<CustomizationPreviewContent t={t} s={s} />

				<ValuePicker
					values={heightValues}
					selectedValue={currentHeight}
					onSelect={handleChange}
				/>

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

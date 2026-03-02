import { CustomizationPreviewContent } from '@config/tsx';
import { Box, MainText, SimpleButtonUi, ValuePicker } from '@core/ui';
import { pxNative } from '@lib/theme';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from "mobx-react-lite";
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

export const InputRadiusSettings = observer(() => {
	const { currentTheme, setThemeValue, defaultTheme } = themeStore;
	const { t } = useTranslation();

	const radiusValues = [0, 3, 5, 10, 15, 20, 25, 30];
	const currentRadius = pxNative(currentTheme.input_radius_300);

	const handleChange = (value: number) => setThemeValue('input_radius_300', `${value}px`);
	const handleReset = () => setThemeValue('input_radius_300', defaultTheme.input_radius_300);

	return (
		<ProfileSettingsWrapper
			tKey='settings_input_radius'
			height={45}
		>
			<Box
				flex={1}
				height={"100%"}
				gap={15}
			>
				<CustomizationPreviewContent t={t} s={s} />

				<ValuePicker
					values={radiusValues}
					selectedValue={currentRadius}
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

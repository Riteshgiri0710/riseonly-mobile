import { colorValues } from '@config/const';
import { CustomizationPreviewContent } from '@config/tsx';
import { BottomSheetUi, Box, GroupedBtns } from '@core/ui';
import { getCurrentRoute } from '@lib/navigation';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ColorPicker, { HueSlider, OpacitySlider, Panel1 } from 'reanimated-color-picker';
import { getCustomizationSettingsBtns } from 'src/modules/theme/shared/config/grouped-btns-data';
import { themeStore } from 'src/modules/theme/stores';

type ColorPickerResult = {
	hex: string;
	rgb: string;
	rgba: string;
	hsl: string;
	hsla: string;
};

export const CustomizationSettings = observer(() => {
	const {
		colorBottomSheet: { colorBottomSheet, setColorBottomSheet },
		changeSomeColor,
	} = themeStore;
	const [selectedColor, setSelectedColor] = useState('rgba(255, 255, 255, 1)');

	const insets = useSafeAreaInsets();
	const { t } = useTranslation();
	const route = getCurrentRoute()?.name;

	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const groupedBtns = useMemo(() => getCustomizationSettingsBtns(t), [t]);

	const handleColorPreview = useCallback((colorResult: ColorPickerResult) => {
		setSelectedColor(colorResult.rgba);
	}, []);

	const handleColorChange = useCallback((colorResult: ColorPickerResult) => {
		if (!route) return;
		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		debounceTimerRef.current = setTimeout(() => { changeSomeColor(colorResult.rgba); }, 0);
	}, [route, changeSomeColor]);

	const onSelectColorChange = (colorResult: ColorPickerResult) => {
		'worklet';
		runOnJS(handleColorPreview)(colorResult);
	};

	const onSelectColorComplete = (colorResult: ColorPickerResult) => {
		'worklet';
		runOnJS(handleColorPreview)(colorResult);
		runOnJS(handleColorChange)(colorResult);
	};

	useEffect(() => {
		setSelectedColor(String(colorValues.BgColorSettings));
	}, [colorBottomSheet]);

	return (
		<ProfileSettingsWrapper
			tKey='customization_title'
			height={45}
		>
			<Box
				flex={1}
				height={"100%"}
			>
				<GroupedBtns
					items={groupedBtns}
					leftFlex={0}
				/>

				<BottomSheetUi
					snap={['90%']}
					isBottomSheet={colorBottomSheet}
					setIsBottomSheet={setColorBottomSheet}
					bottomSheetViewStyle={{ flex: 1, height: "100%" }}
				>
					<Box
						style={{ ...styles.container }}
						flex={1}
						height={"100%"}
						justify="space-between"
					>
						<Box height={"50%"} width={"100%"}>
							<CustomizationPreviewContent t={t} s={styles} />
						</Box>

						<Box
							height={"50%"}
							width={"100%"}
							style={{ paddingBottom: insets.bottom + 20 }}
						>
							<ColorPicker
								value={selectedColor}
								onComplete={onSelectColorComplete}
								onChange={onSelectColorChange}
								style={styles.colorPicker}
							>
								<Panel1 style={{ height: "60%" }} />
								<View style={styles.slidersContainer}>
									<HueSlider
										style={styles.slider}
										thumbColor="#fff"
									/>
									<OpacitySlider
										style={styles.slider}
										thumbColor="#fff"
									/>
								</View>
							</ColorPicker>
						</Box>
					</Box>
				</BottomSheetUi>
			</Box>
		</ProfileSettingsWrapper>
	);
});

const styles = StyleSheet.create({
	container: {
		paddingVertical: 5,
		paddingHorizontal: 16,
		alignItems: 'center',
		gap: 15
	},
	colorPreview: {
		width: 60,
		height: 60,
		borderRadius: 30,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#ccc',
	},
	colorText: {
		marginBottom: 16,
		fontSize: 14,
	},
	colorPicker: {
		width: '100%',
		height: "100%",
		justifyContent: "flex-end",
		gap: 10
	},
	btnpreview: {
		paddingVertical: 10,
		paddingHorizontal: 30,
	},
	slidersContainer: {
		width: '100%',
		marginTop: 16,
		gap: 16,
		height: "30%"
	},
	slider: {
		width: '100%',
		height: 30,
		borderRadius: 15,
	},
});
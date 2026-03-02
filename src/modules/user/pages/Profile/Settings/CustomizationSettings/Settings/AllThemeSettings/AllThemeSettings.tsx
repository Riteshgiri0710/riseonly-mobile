import { GroupBtnsType } from '@config/types';
import { BottomSheetUi, Box, GroupedBtns, MainText, SecondaryText, SimpleButtonUi, ValuePicker } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ColorPicker, { HueSlider, OpacitySlider, Panel1 } from 'reanimated-color-picker';
import { ThemeT, getThemeKeyType, isMainThemeKey, themeStore } from 'src/modules/theme/stores';

export const AllThemeSettings = observer(() => {
	const { currentTheme, setThemeValue, defaultTheme } = themeStore;
	const [editingKey, setEditingKey] = useState<keyof ThemeT | null>(null);
	const [selectedColor, setSelectedColor] = useState('rgba(255, 255, 255, 1)');
	const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

	const insets = useSafeAreaInsets();
	const { t } = useTranslation();

	const allKeys = useMemo(() => Object.keys(currentTheme).filter(key =>
		!isMainThemeKey(key as keyof ThemeT) && key !== 'mainGradientColor'
	) as (keyof ThemeT)[], [currentTheme]);

	const groupKeysByCategory = useCallback((keys: (keyof ThemeT)[]) => {
		const groups: Record<string, (keyof ThemeT)[]> = {
			bg: [],
			border: [],
			radius: [],
			btn: [],
			primary: [],
			error: [],
			text: [],
			input: [],
		};

		keys.forEach(key => {
			if (key.startsWith('bg_')) groups.bg.push(key);
			else if (key.startsWith('border_')) groups.border.push(key);
			else if (key.startsWith('radius_')) groups.radius.push(key);
			else if (key.startsWith('btn_')) groups.btn.push(key);
			else if (key.startsWith('primary_')) groups.primary.push(key);
			else if (key.startsWith('error_')) groups.error.push(key);
			else if (key.startsWith('text_') || key.startsWith('secondary_')) groups.text.push(key);
			else if (key.startsWith('input_')) groups.input.push(key);
		});

		return groups;
	}, []);

	const groupedKeys = useMemo(() => groupKeysByCategory(allKeys), [allKeys, groupKeysByCategory]);

	const handleEdit = useCallback((key: keyof ThemeT) => {
		setEditingKey(key);
		const type = getThemeKeyType(key);

		if (type === 'color') {
			setSelectedColor(String(currentTheme[key]));
		} else if (type === 'size') {
		}
		setIsBottomSheetOpen(true);
	}, [currentTheme]);

	const handleColorChange = useCallback((colorResult: any) => {
		if (!editingKey) return;
		setSelectedColor(colorResult.rgba);
	}, [editingKey]);

	const handleColorComplete = useCallback((colorResult: any) => {
		if (!editingKey) return;
		setThemeValue(editingKey, colorResult.rgba);
	}, [editingKey, setThemeValue]);

	const onSelectColorChange = useCallback((colorResult: any) => {
		'worklet';
		runOnJS(handleColorChange)(colorResult);
	}, [handleColorChange]);

	const onSelectColorComplete = useCallback((colorResult: any) => {
		'worklet';
		runOnJS(handleColorChange)(colorResult);
		runOnJS(handleColorComplete)(colorResult);
	}, [handleColorChange, handleColorComplete]);

	const handleSizeChange = useCallback((value: number) => {
		if (!editingKey) return;
		const key = editingKey;

		if (key.includes('radius')) {
			setThemeValue(key, `${value}px`);
		} else if (key.includes('height')) {
			setThemeValue(key, `${value}px`);
		} else if (key.includes('border')) {
			const currentBorder = String(currentTheme[key]);
			const parts = currentBorder.split(' ');
			setThemeValue(key, `${value}px ${parts.slice(1).join(' ')}`);
		}
		setIsBottomSheetOpen(false);
		setEditingKey(null);
	}, [editingKey, currentTheme, setThemeValue]);

	const handleResetToDefault = useCallback(() => {
		if (!editingKey) return;
		setThemeValue(editingKey, defaultTheme[editingKey]);
		setIsBottomSheetOpen(false);
		setEditingKey(null);
	}, [editingKey, defaultTheme, setThemeValue]);

	const getSizeOptions = (key: keyof ThemeT): number[] => {
		if (key.includes('radius')) return [0, 3, 5, 10, 15, 20, 25, 30, 35, 40];
		if (key.includes('height')) return [30, 35, 40, 45, 50, 55, 60];
		if (key.includes('border')) return [1, 2, 3, 4, 5];
		return [0, 5, 10, 15, 20, 25, 30];
	};

	const getCurrentSize = (key: keyof ThemeT): number => {
		const value = String(currentTheme[key]);
		const match = value.match(/(\d+)px/);
		return match ? parseInt(match[1]) : 0;
	};

	const getButtons = (): GroupBtnsType[] => {
		const buttons: GroupBtnsType[] = [];
		let groupIndex = 1;

		Object.entries(groupedKeys).forEach(([category, keys]) => {
			if (keys.length === 0) return;

			keys.forEach((key) => {
				const type = getThemeKeyType(key);
				const value = currentTheme[key];

				buttons.push({
					group: String(groupIndex),
					text: key,
					callback: () => handleEdit(key),
					height: 50,
					leftIcon: type === 'color' ? (
						<View
							style={[
								styles.colorCircle,
								{
									backgroundColor: String(value),
									borderColor: currentTheme.border_100
								}
							]}
						/>
					) : (
						<SecondaryText px={13}>{String(value)}</SecondaryText>
					)
				});
			});

			groupIndex++;
		});

		return buttons;
	};

	return (
		<ProfileSettingsWrapper
			tKey='all_theme_settings'
			height={45}
		>
			<>
				<Box flex={1} style={{ paddingTop: 15 }}>
					<GroupedBtns items={getButtons()} />
				</Box>

				<BottomSheetUi
					snap={['60%']}
					isBottomSheet={isBottomSheetOpen}
					setIsBottomSheet={setIsBottomSheetOpen}
				>
					{editingKey && getThemeKeyType(editingKey) === 'color' && (
						<View style={{ flex: 1, justifyContent: 'space-between' }}>
							<ColorPicker
								value={selectedColor}
								onComplete={onSelectColorComplete}
								onChange={onSelectColorChange}
								style={styles.colorPicker}
							>
								<Panel1 style={{ height: 300, borderRadius: 12 }} />
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

							<View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 10 }}>
								<SimpleButtonUi
									height={45}
									bRad={10}
									bgColor={currentTheme.btn_bg_300}
									onPress={handleResetToDefault}
									centered
								>
									<MainText>
										{t('return_text')}
									</MainText>
								</SimpleButtonUi>
							</View>
						</View>
					)}

					{editingKey && getThemeKeyType(editingKey) === 'size' && (
						<View style={{ flex: 1, justifyContent: 'space-between', paddingBottom: insets.bottom + 10 }}>
							<View style={{ flex: 1, justifyContent: 'center' }}>
								<Box>
									<MainText tac='center' px={18} fontWeight='600'>
										{editingKey}
									</MainText>
									<SecondaryText tac='center' px={14} mt={5}>
										{t('select_value')}
									</SecondaryText>
								</Box>

								<ValuePicker
									values={getSizeOptions(editingKey)}
									selectedValue={getCurrentSize(editingKey)}
									onSelect={handleSizeChange}
								/>
							</View>

							<View style={{ paddingHorizontal: 20 }}>
								<SimpleButtonUi
									height={45}
									bRad={10}
									bgColor={currentTheme.btn_bg_300}
									onPress={handleResetToDefault}
									centered
								>
									<MainText>
										{t('return_text')}
									</MainText>
								</SimpleButtonUi>
							</View>
						</View>
					)}
				</BottomSheetUi>
			</>
		</ProfileSettingsWrapper>
	);
});

const styles = StyleSheet.create({
	colorCircle: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
	},
	colorPicker: {
		width: '100%',
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	slidersContainer: {
		marginTop: 20,
		gap: 15,
	},
	slider: {
		borderRadius: 20,
	},
});


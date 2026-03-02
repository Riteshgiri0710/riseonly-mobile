import { pxNative } from '@lib/theme';
import { observer } from 'mobx-react-lite';
import { ScrollView, StyleSheet } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';
import { MainText } from '../MainText/MainText';
import { SimpleButtonUi } from '../SimpleButtonUi/SimpleButtonUi';

interface ValuePickerProps {
	values: number[];
	selectedValue: number;
	onSelect: (value: number) => void;
	unit?: string;
}

export const ValuePicker = observer(({
	values,
	selectedValue,
	onSelect,
	unit = 'px'
}: ValuePickerProps) => {
	const { currentTheme } = themeStore;

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.container}
		>
			{values.map((value) => {
				const isSelected = value === selectedValue;

				return (
					<SimpleButtonUi
						key={value}
						onPress={() => onSelect(value)}
						activeOpacity={1}
						bgColor={isSelected
							? currentTheme.primary_100
							: currentTheme.btn_bg_300}
						style={[
							styles.item,
							{
								backgroundColor: isSelected
									? currentTheme.primary_100
									: currentTheme.btn_bg_300,
								borderRadius: pxNative(currentTheme.radius_100)
							}
						]}
					>
						<MainText
							px={14}
							color={isSelected ? currentTheme.text_100 : currentTheme.secondary_100}
						>
							{value}{unit}
						</MainText>
					</SimpleButtonUi>
				);
			})}
		</ScrollView>
	);
});

const styles = StyleSheet.create({
	container: {
		gap: 5,
		paddingVertical: 10,
	},
	item: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		minWidth: 60,
		alignItems: 'center',
		justifyContent: 'center',
	},
});


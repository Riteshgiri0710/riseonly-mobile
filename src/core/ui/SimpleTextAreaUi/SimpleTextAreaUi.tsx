import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useRef } from 'react';
import { NativeSyntheticEvent, StyleProp, StyleSheet, TextInput, TextInputProps, TextInputSelectionChangeEventData, TextStyle, ViewStyle } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';
import { Box } from '../BoxUi/Box';

interface SimpleTextAreaUiProps extends Omit<TextInputProps, 'style'> {
	containerStyle?: StyleProp<ViewStyle>;
	inputStyle?: StyleProp<TextStyle>;
	maxHeight?: number;
	maxLength?: number;
	values?: Record<string, any> | null;
	debug?: boolean;
	style?: StyleProp<TextStyle>;
	setText?: (text: string) => void;
	disabled?: boolean;
	name?: string;
	useValue?: boolean;
	bgColor?: string;
	setValue?: (key: string, value: string) => void;
	groupContainerStyle?: ViewStyle;
}

export const SimpleTextAreaUi = observer(({
	containerStyle,
	inputStyle,
	maxHeight = 120,
	maxLength,
	values = null,
	setValue,
	setText,
	name,
	debug = false,
	style = {},
	onChangeText,
	disabled = false,
	useValue = false,
	groupContainerStyle = {},
	bgColor,
	...props
}: SimpleTextAreaUiProps) => {
	const { currentTheme } = themeStore;
	const inputRef = useRef<TextInput>(null);
	const cursorPositionRef = useRef(0);

	const handleChangeText = (newText: string) => {
		if (setText) setText(newText);
		if (onChangeText) onChangeText(newText);
		if (setValue && name) setValue(name as string, newText);

		cursorPositionRef.current = newText.length;
	};

	const handleSelectionChange = useCallback((event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
		cursorPositionRef.current = event.nativeEvent.selection.start;
	}, []);

	const styles = useMemo(
		() => createStyles(currentTheme.text_100, maxHeight, disabled, containerStyle, inputStyle),
		[currentTheme.text_100, maxHeight, disabled, containerStyle, inputStyle]
	);

	return (
		<Box
			style={[
				styles.container,
				groupContainerStyle
			]}
			debug={debug}
		>
			<TextInput
				ref={inputRef}
				style={[styles.input, style, { backgroundColor: bgColor || currentTheme.bg_200 }]}
				multiline={true}
				scrollEnabled={true}
				placeholderTextColor={currentTheme.secondary_100}
				cursorColor={currentTheme.primary_100}
				selectionColor={currentTheme.primary_100}
				value={useValue ? props.value : values?.[name as string]}
				onChangeText={handleChangeText}
				spellCheck={false}
				autoCorrect={false}
				onSelectionChange={handleSelectionChange}
				maxLength={maxLength}
				editable={!disabled}
				selectionHandleColor={currentTheme.primary_100}
				underlineColorAndroid={currentTheme.primary_100}
				{...props}
			/>
			{/* {(maxLength && text) && (
				<Box
					style={{
						position: "absolute",
						bottom: 0,
						right: -5
					}}
				>
					<MainText
						color={getMaxLengthColor(text.length, maxLength)}
						px={11}
					>
						{maxLength - text.length}
					</MainText>
				</Box>
			)} */}
		</Box>
	);
});

const createStyles = (
	textColor: string,
	maxHeight: number,
	disabled: boolean,
	containerStyle?: StyleProp<ViewStyle>,
	inputStyle?: StyleProp<TextStyle>
) => StyleSheet.create({
	container: {
		...(containerStyle as any),
		position: "relative"
	},
	input: {
		color: textColor,
		minHeight: 40,
		maxHeight: maxHeight,
		opacity: disabled ? 0.5 : 1,
		...(inputStyle as any),
	},
});
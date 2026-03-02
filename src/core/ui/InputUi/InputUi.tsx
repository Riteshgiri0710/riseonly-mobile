import { ErrorTextUi } from '@core/ui';
import { pxNative } from '@lib/theme';
import { InputUiValues } from '@ui/types';
import { observer } from 'mobx-react-lite';
import { NativeSyntheticEvent, StyleProp, TextInputChangeEventData, View, ViewStyle } from 'react-native';
import { TextInput, TextInputProps } from 'react-native-paper';
import { themeStore } from 'src/modules/theme/stores';

interface InputUiProps<T> extends Omit<TextInputProps, 'error'>, InputUiValues {
	values?: T,
	errors?: T,
	mode?: 'flat' | 'outlined',
	placeholder?: string;
	name?: string;
	errorTextPost?: "absolute" | "static";
	containerStyle?: StyleProp<ViewStyle>;
}

export const InputUi = observer(<T,>({
	style,
	mode = 'outlined',
	values = {} as T,
	errors = {} as T,
	placeholder = '',
	name = "",
	errorTextPost = "absolute",
	containerStyle = {},
	setValue,
	...props
}: InputUiProps<T>) => {
	const { currentTheme } = themeStore;

	const onChangeHandler = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
		if (!setValue) return;
		setValue(name, e.nativeEvent.text);
	};

	const getInput = () => (
		<TextInput
			value={(values as any)[name] || ""}
			onChange={onChangeHandler}
			mode={mode}
			label={placeholder}
			spellCheck={false}
			autoCorrect={false}
			style={[
				{
					color: currentTheme.text_100,
					height: pxNative(currentTheme.input_height_300),
					backgroundColor: currentTheme.input_bg_100,
					paddingTop: 0,
				},
				style
			]}
			theme={{
				roundness: pxNative(currentTheme.input_radius_300),
			}}
			placeholderTextColor={currentTheme.secondary_100}
			textColor={currentTheme.text_100}
			{...props}
		/>
	);

	if (!setValue) return getInput();

	return (
		<View
			style={[{ position: 'relative', width: "100%" }, containerStyle]}
		>
			{getInput()}
			{(errors as any)[name + 'Err'] && (
				<ErrorTextUi
					style={{
						position: errorTextPost,
						bottom: -15
					}}
					px={12}
				>
					{(errors as any)[name + 'Err']}
				</ErrorTextUi>
			)}
		</View>
	);
});
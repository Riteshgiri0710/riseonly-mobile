import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';
import { getMaxLengthColor } from '@lib/numbers';
import { deleteSpacesFromStartAndEnd } from '@lib/text';
import { GROUPED_BTNS_HEIGHT } from '@lib/theme';
import { observer } from 'mobx-react-lite';
import { JSX } from 'react';
import { NativeSyntheticEvent, StyleProp, StyleSheet, TextInput, TextInputChangeEventData, TextInputProps, ViewStyle } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';
import { Box } from '../BoxUi/Box';
import { ErrorTextUi } from '../ErrorTextUi/ErrorTextUi';
import { LoaderUi } from '../LoaderUi/LoaderUi';
import { MainText } from '../MainText/MainText';
import { SecondaryText } from '../SecondaryText/SecondaryText';

type SimpleInputUiVariants = "default" | "groupedBtn";
interface SimpleInputUiProps extends TextInputProps {
	name?: null | string;
	errors?: Record<string, string> | null;
	maxLength?: number;
	value?: string;
	values?: Record<string, any> | null;
	title?: string;
	groupContainer?: boolean;
	groupContainerStyle?: StyleProp<ViewStyle>;
	setValue?: (key: string, value: string) => void;
	useValue?: boolean;
	debug?: boolean;
	bgColor?: string;
	bRad?: number;
	rightJsx?: JSX.Element;
	loading?: MobxSaiWsInstance<any>;
	onChangeInput?: (text: string) => void;
	noSpaces?: boolean;
	noSpaceAtStart?: boolean;
	onlyLatinCharacters?: boolean;
	variant?: SimpleInputUiVariants;
	endGroupTitle?: string;
}

export const SimpleInputUi = observer(({
	loading,
	name = null,
	errors = null,
	variant = "default",
	maxLength,
	value,
	values = null,
	title,
	setValue,
	onChangeInput,
	groupContainer = false,
	endGroupTitle = "",
	useValue = false,
	debug = false,
	bgColor,
	rightJsx,
	bRad = 10,
	noSpaces = false,
	noSpaceAtStart = false,
	onlyLatinCharacters = false,
	groupContainerStyle = {},
	...props
}: SimpleInputUiProps) => {
	const { currentTheme } = themeStore;

	const onChangeHandler = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
		if (!setValue || !name || (values?.[name] == "undefined")) return;
		let newValue = e.nativeEvent.text;

		if (noSpaces) {
			newValue = deleteSpacesFromStartAndEnd(newValue);
		}

		if (noSpaceAtStart) {
			newValue = newValue.replace(/^\s+/, '');
		}

		if (onlyLatinCharacters) {
			newValue = newValue.replace(/[^a-zA-Z0-9]/g, '');
		}

		if (onChangeInput) {
			onChangeInput(newValue);
		}
		setValue(name, newValue);
	};

	const getInput = () => {
		if (useValue) {
			return (
				<TextInput
					placeholderTextColor={currentTheme.secondary_100}
					cursorColor={currentTheme.primary_100}
					selectionColor={currentTheme.primary_100}
					onChange={e => onChangeHandler(e)}
					maxLength={maxLength}
					spellCheck={false}
					autoCorrect={false}
					value={value}
					{...props}
					style={[
						{
							color: currentTheme.text_100,
							...(props.style as any),
						},
						variant === "groupedBtn" ? {
							height: "100%",
							width: "100%",
							fontSize: 17,
						} : {},
					]}
				/>
			);
		}

		return (
			<TextInput
				placeholderTextColor={currentTheme.secondary_100}
				cursorColor={currentTheme.primary_100}
				selectionColor={currentTheme.primary_100}
				onChange={e => onChangeHandler(e)}
				maxLength={maxLength}
				value={values?.[name as string]}
				spellCheck={false}
				autoCorrect={false}
				{...props}
				style={[
					{
						color: currentTheme.text_100,
						...(props.style as any),
					},
					variant === "groupedBtn" ? {
						height: "100%",
						width: "100%",
						fontSize: 17,
					} : {},
				]}
			/>
		);
	};

	if (!setValue && maxLength == 0) return getInput();

	return (
		<Box
			style={[
				errors?.[name as string + 'Err'] ? s.errorStyles : {},
			]}
			debug={debug}
		>
			{(title && (variant === "default")) && (
				<MainText
					px={12}
					style={s.title}
				>
					{title}
				</MainText>
			)}

			{(title && (variant === "groupedBtn")) && (
				<SecondaryText
					px={12}
					ml={10}
					mb={1}
				>
					{title?.toUpperCase()}
				</SecondaryText>
			)}

			<Box
				style={[
					{
						backgroundColor: bgColor || currentTheme.bg_200,
						borderRadius: bRad,
					},
					groupContainer ? s.groupContainer : {},
					variant === "groupedBtn" ? {
						height: GROUPED_BTNS_HEIGHT,
						borderRadius: 30,
						paddingHorizontal: 15,
					} : {},
					groupContainerStyle,
				]}
			>
				<Box
					fD='row'
					justify='space-between'
					position='relative'
					style={groupContainerStyle}
					height={variant === "groupedBtn" ? "100%" : undefined}
				>
					{getInput()}

					{loading?.status === "pending" && (
						<Box
							style={{
								position: 'absolute',
								right: 15,
							}}
							height={"100%"}
							justify='center'
						>
							<LoaderUi size={"small"} color={currentTheme.text_100} />
						</Box>
					)}

					{maxLength && value && (
						<Box
							style={{
								position: 'absolute',
								bottom: 0,
								right: -5,
							}}
						>
							<MainText color={getMaxLengthColor(value.length, maxLength)} px={11}>
								{maxLength - value.length}
							</MainText>
						</Box>
					)}
				</Box>

				{errors?.[name as string + 'Err'] && (
					<ErrorTextUi
						style={s.error}
						px={11}
					>
						{errors?.[name as string + 'Err']}
					</ErrorTextUi>
				)}
			</Box>

			{endGroupTitle && (
				<SecondaryText
					px={12}
					ml={10}
					mt={3}
				>
					{endGroupTitle}
				</SecondaryText>
			)}
		</Box>
	);
});

const s = StyleSheet.create({
	groupContainer: {
		position: 'relative',
		borderRadius: 10,
		flexDirection: 'column',
		gap: 15,
		paddingVertical: 8,
		paddingHorizontal: 12.5,
		width: '100%',
	},
	title: {
		marginLeft: 6,
		marginBottom: 3
	},
	error: {
		position: 'absolute',
		bottom: -14,
	},
	errorStyles: {
		marginBottom: 1
	},
});
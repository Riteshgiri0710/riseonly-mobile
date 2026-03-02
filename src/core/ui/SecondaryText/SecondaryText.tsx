import { TextAlignT } from '@ui/types';
import { observer } from 'mobx-react-lite';
import { Text, TextProps } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

interface SecondaryTextProps extends TextProps {
	px?: number;
	tac?: TextAlignT;
	ml?: number;
	mt?: number;
	mb?: number;
	debug?: boolean;
	strikethrough?: boolean;
	color?: string;
}

export const SecondaryText = observer(({
	style,
	px = 16,
	tac = "auto",
	ml = 0,
	mt = 0,
	mb = 0,
	debug = false,
	strikethrough = false,
	color,
	...props
}: SecondaryTextProps) => {
	const { currentTheme } = themeStore;

	return (
		<Text
			style={[
				{
					fontSize: px,
					color: color || currentTheme.secondary_100,
					textAlign: tac,
					marginLeft: ml,
					marginTop: mt,
					marginBottom: mb,
					textDecorationLine: strikethrough ? 'line-through' : 'none',
				},
				debug && {
					borderWidth: 0.5,
					borderColor: "red",
				},
				style
			]}
			{...props}
		/>
	);
});
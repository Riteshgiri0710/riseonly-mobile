import { getSystemMessageType } from '@core/config/const';
import { ContextMenuUi, MainText, PressableUi } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

interface SystemMessageProps {
	message: string;
	isSticky?: boolean;
	contextMessage?: string;
}

export const SystemMessage = observer(({
	message,
	isSticky = false,
	contextMessage
}: SystemMessageProps) => {
	const { currentTheme } = themeStore;

	const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);

	const { t } = useTranslation();
	const anchorRef = useRef<View | null>(null);

	const handleLongPress = () => {
		console.log('long press');
		setIsContextMenuVisible(true);
	};

	return (
		<View
			ref={anchorRef}
			style={[
				s.container,
				isSticky && s.sticky
			]}
		>
			<PressableUi
				style={[
					s.systemMessageContainer,
					{
						backgroundColor: currentTheme.bg_200,
						borderRadius: 30
					}
				]}
				onLongPress={() => handleLongPress()}
			>
				<MainText
					px={13}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{getSystemMessageType(message, t) || ''}
				</MainText>
			</PressableUi>

			{contextMessage && (
				<ContextMenuUi
					items={[
						{
							id: 1,
							label: contextMessage,
							callback: () => { }
						}
					]}
					offset={{ x: 0, y: 10 }}
					position='bottom'
					anchorRef={anchorRef}
					isVisible={isContextMenuVisible}
					onClose={() => setIsContextMenuVisible(false)}
				/>
			)}
		</View >
	);
});

const s = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 10,
		paddingHorizontal: 10,
		width: '100%',
		zIndex: 1,
		justifyContent: 'center',
	},
	sticky: {
	},
	systemMessageContainer: {
		paddingHorizontal: 8.5,
		paddingVertical: 4,
	},
	line: {
		height: 0.5,
		flex: 1,
	}
}); 
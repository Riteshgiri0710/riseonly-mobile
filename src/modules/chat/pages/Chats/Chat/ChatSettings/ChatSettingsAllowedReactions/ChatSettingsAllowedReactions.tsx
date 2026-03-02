import { RootStackParamList } from '@app/router';
import { Box, SimpleTextAreaUi, SwitchUi } from '@core/ui';
import { ProfileSettingsWrapper } from '@core/widgets/wrappers';
import { defaultReactions } from '@modules/chat/shared/config/const';
import { themeStore } from '@modules/theme/stores';
import { RouteProp, useRoute } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export const ChatSettingsAllowedReactions = observer(() => {
	const { currentTheme } = themeStore;

	const { t } = useTranslation();
	const { params: { selectedChat } } = useRoute<RouteProp<RootStackParamList, 'ChatSettingsLinkedChat'>>();

	const isAllowedReactions = true;
	const allowedReactions = defaultReactions;

	const [value, setValue] = useState(allowedReactions.join(""));

	return (
		<ProfileSettingsWrapper
			tKey={t(`chat_settings_allowed_reactions`)}
			height={45}
			PageHeaderUiStyle={{ backgroundColor: currentTheme.bg_100 }}
		>
			<Box
				gap={30}
				width={"100%"}
			>
				<SwitchUi
					variant="groupedBtn"
					text={t("allow_reactions_switch")}
					endGroupTitle={t(`allow_reactions_switch_${selectedChat.type.toLowerCase()}_explanation`)}
					isOpen={isAllowedReactions}
				/>

				{isAllowedReactions && (
					<View
						style={{ width: "100%" }}
					>
						<SimpleTextAreaUi
							multiline
							value={value}
							onChangeText={setValue}
							style={s.textArea}
						/>
					</View>
				)}
			</Box>
		</ProfileSettingsWrapper>
	);
});

const s = StyleSheet.create({
	textArea: {
		fontSize: 20,
		maxHeight: 250,
		borderRadius: 30,
		paddingHorizontal: 15,
		paddingVertical: 12,
		alignSelf: 'stretch'
	},
});

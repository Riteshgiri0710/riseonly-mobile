import { Box, GroupedBtns, MainText, SimpleButtonUi } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { getChatLinkSettingsBtns, getForwardBtns } from 'src/modules/chat/shared/config/grouped-btns-data';
import { chatsActionsStore, chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { themeStore } from 'src/modules/theme/stores';

export const CreateChannelSettings = observer(() => {
	const { currentTheme } = themeStore;
	const {
		createChannelAction
	} = chatsActionsStore;
	const {
		channelChatType: { channelChatType, setChannelChatType },
		forwardInChatEnabled: { forwardInChatEnabled, setForwardInChatEnabled }
	} = chatsInteractionsStore;

	const { t } = useTranslation();

	const createChannelPress = () => createChannelAction();

	const linkBtns = useMemo(() => {
		return getChatLinkSettingsBtns(t, channelChatType, setChannelChatType);
	}, [channelChatType]);
	const forwardBtns = useMemo(() => {
		return getForwardBtns(t, forwardInChatEnabled, setForwardInChatEnabled);
	}, [forwardInChatEnabled]);

	return (
		<Box
			style={{ paddingHorizontal: 15, paddingTop: 15 }}
			height={"100%"}
			gap={100}
			justify="space-between"
		>
			<Box
				gap={40}
			>
				<GroupedBtns items={linkBtns} />
				<GroupedBtns items={forwardBtns} />
			</Box>

			<Box
				width={"100%"}
			>
				<SimpleButtonUi
					onPress={createChannelPress}
					bgColor={currentTheme.primary_100}
					centered
					width={"100%"}
					style={s.createButton}
					bRad={10}
				>
					<MainText>
						{t("create_channel")}
					</MainText>
				</SimpleButtonUi>
			</Box>
		</Box>
	);
});

const s = StyleSheet.create({
	createButton: {
		paddingHorizontal: 20,
		paddingVertical: 15,
		width: "100%",
	}
});
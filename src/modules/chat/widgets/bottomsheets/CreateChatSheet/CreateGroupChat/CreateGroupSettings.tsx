import { Box, GroupedBtns, MainText, SimpleButtonUi } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { getForwardBtns, getGroupLinkSettingsBtns } from 'src/modules/chat/shared/config/grouped-btns-data';
import { chatsActionsStore, chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { themeStore } from 'src/modules/theme/stores';

export const CreateGroupSettings = observer(() => {
	const { currentTheme } = themeStore;
	const {
		createGroupAction
	} = chatsActionsStore;
	const {
		groupChatType: { groupChatType, setGroupChatType },
		forwardInGroupEnabled: { forwardInGroupEnabled, setForwardInGroupEnabled }
	} = chatsInteractionsStore;

	const { t } = useTranslation();

	const createGroupPress = () => createGroupAction();

	const linkBtns = useMemo(() => {
		return getGroupLinkSettingsBtns(t, groupChatType, setGroupChatType);
	}, [groupChatType]);
	const forwardBtns = useMemo(() => {
		return getForwardBtns(t, forwardInGroupEnabled, setForwardInGroupEnabled);
	}, [forwardInGroupEnabled]);

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
					onPress={createGroupPress}
					bgColor={currentTheme.primary_100}
					centered
					width={"100%"}
					style={s.createButton}
					bRad={10}
				>
					<MainText>
						{t("create_group")}
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
import { AsyncDataRender, HoldContextMenuUi } from '@core/ui';
import { onlineServices } from '@core/stores/online';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { observer } from 'mobx-react-lite';
import { Fragment, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { ChatItem } from 'src/modules/chat/components/ChatItem/ChatItem';
import { chatsActionsStore, chatsInteractionsStore } from 'src/modules/chat/stores/chats';
import { ChatInfo } from 'src/modules/chat/stores/chats/chats-actions/types';
import { messageActionsStore, messageInteractionsStore } from 'src/modules/chat/stores/message';
import { themeStore } from 'src/modules/theme/stores';

interface AllChatsProps {
	chatCallback?: (item: ChatInfo) => void;
	scrollEnabled?: boolean;
}

export const AllChats = observer(({
	chatCallback,
	scrollEnabled = true,
}: AllChatsProps) => {
	const { currentTheme } = themeStore;
	const {
		chats: { data, status },
		getChatsAction
	} = chatsActionsStore;
	const { getMessagesAction } = messageActionsStore;

	const { t } = useTranslation();

	useFocusEffect(
		useCallback(() => {
			getChatsAction();
		}, []),
	);

	// useEffect(() => {
	// 	const firstId = data?.chats?.[0]?.id;
	// 	if (!firstId || messageInteractionsStore.shouldSkipGetMessagesOnFocus()) return;
	// 	getMessagesAction(false, false, firstId);
	// }, [data?.chats, getMessagesAction]);

	const renderItem = useCallback(({ item, index }: { item: ChatInfo; index?: number; }) => {
		if (!item) {
			console.warn(`[AllChats] renderItem: item is null at index ${index}`);
			return null;
		}
		if (!item.typing_datas) item.typing_datas = [];
		if (!item.id) {
			console.warn(`[AllChats] renderItem: item.id is missing at index ${index}`, item);
			return null;
		}

		const isOnline = onlineServices.getEffectiveStatus(item?.participant?.id, item?.participant).is_online;
		return <ChatItem item={item} chatCallback={chatCallback} isOnline={isOnline} />;
	}, [chatCallback]);

	const keyExtractor = useCallback((item: ChatInfo, index: number) => {
		const key = item?.id ? String(item.id) : `chat-${index}`;
		if (!item?.id) {
			console.warn(`[AllChats] keyExtractor: item.id is missing at index ${index}`, item);
		}
		return key;
	}, []);

	return (
		<Fragment>
			<AsyncDataRender
				data={data?.chats}
				status={status}
				noDataText={t("no_chats")}
				messageHeightPercent={60}
				noDataHeightPercent={15}
				isEmptyScrollView={false}
				renderContent={(items) => {
					const sizeStyle = scrollEnabled
						? { flex: 1 as const, height: '100%' as const }
						: {};

					return (
						<View
							style={[
								sizeStyle,
								s.chatsList,
							]}
						>
							<FlashList
								data={items}
								renderItem={renderItem}
								keyExtractor={keyExtractor}
								estimatedItemSize={80}
								onEndReachedThreshold={0.5}
								bounces={true}
								scrollEnabled={scrollEnabled}
								removeClippedSubviews={false}
								drawDistance={1200}
								extraData={[items.length, onlineServices.statusByUserId]}
								style={{
									backgroundColor: "transparent",
									overflow: 'visible' as const,
									...(Platform.OS === 'ios' && { clipsToBounds: false }),
								}}
							/>
						</View>
					);
				}}
			/>

			<HoldContextMenu />
		</Fragment>
	);
});

const s = StyleSheet.create({
	chatsList: {
		width: "100%",
		height: "100%",
		flex: 1,
	},
});

const HoldContextMenu = observer(() => {
	const {
		chatPreviewOpen: { chatPreviewOpen },
		onChatPreviewCloseHandler
	} = chatsInteractionsStore;

	return (
		<HoldContextMenuUi
			open={chatPreviewOpen}
			onClose={onChatPreviewCloseHandler}
			itemLayout={null}
		/>
	);
});
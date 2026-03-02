import { getSaiInstanceById } from '@lib/mobx-toolbox/mobxSaiWs';
import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MOCK_CACHE } from 'src/core/config/mock';
import { GetMessagesResponse } from 'src/modules/chat/stores/message';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';
import { NativeChatListView } from '../../../components/Chat/NativeChatList/NativeChatListView';
import type { NativeChatListViewMessage } from '../../../components/Chat/NativeChatList/NativeChatListView';

const createMockMessages = (count: number): NativeChatListViewMessage[] => {
	const messages: NativeChatListViewMessage[] = [];
	for (let i = 0; i < count; i++) {
		messages.push({
			id: `msg-${i}`,
			content: i % 3 === 0 ? "Short message" : "This is a much longer message to test how the native layout engine handles multiple lines and dynamic heights. This replicates Telegram's list rendering performance.",
			isMyMessage: i % 2 === 0,
			showAvatar: true,
			isFirstInGroup: i % 4 === 0,
			created_at: Date.now() - i * 60000,
		});
	}
	return messages;
};

export const TestNativeChat = observer(() => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const navigation = useNavigation();

	// Try to get real messages from MobX instance
	const realMobxData = getSaiInstanceById<GetMessagesResponse>(`getMessages-null-null-test-chat`)?.data?.messages;

	// Extract messages from MOCK_CACHE
	const mockCacheMessages = useMemo(() => {
		// Find any key that looks like getMessages
		const key = Object.keys(MOCK_CACHE).find(k => k.startsWith('getMessages'));
		if (key && MOCK_CACHE[key]?.data?.data?.messages) {
			return MOCK_CACHE[key].data.data.messages;
		}
		return [];
	}, []);

	const formattedMessages = useMemo(() => {
		const sourceData = (realMobxData && realMobxData.length > 0) ? realMobxData : mockCacheMessages;

		if (sourceData && sourceData.length > 0) {
			return sourceData.map((m: any, index: number) => ({
				id: m.id,
				content: m.content ?? '',
				isMyMessage: m.sender_id === profile?.id || m.sender_id === 'me',
				showAvatar: true,
				isFirstInGroup: index === 0 || sourceData[index - 1]?.sender_id !== m.sender_id,
				created_at: m.created_at,
			}));
		}

		return createMockMessages(100);
	}, [realMobxData, mockCacheMessages, profile?.id]);

	return (
		<View style={[styles.container, { backgroundColor: currentTheme.bg_100 }]}>
			<View style={[styles.header, { backgroundColor: currentTheme.bg_100, borderBottomColor: currentTheme.border_100 }]}>
				<TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
					<Text style={{ color: currentTheme.primary_100, fontWeight: '600' }}>Back</Text>
				</TouchableOpacity>
				<Text style={[styles.title, { color: currentTheme.text_100 }]}>Performance Test</Text>
			</View>

			<NativeChatListView
				style={{ flex: 1 }}
				messages={formattedMessages}
				onMessagePress={(id) => console.log('Native Press', id)}
			/>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		height: 60,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		borderBottomWidth: 0.5,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginLeft: 20,
	}
});

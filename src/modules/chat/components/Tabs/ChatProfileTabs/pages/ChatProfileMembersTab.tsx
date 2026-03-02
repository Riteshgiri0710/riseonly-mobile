import { AsyncDataRender, Box } from '@core/ui';
import { useRoute } from '@lib/navigation';
import { MemberItem } from '@modules/chat/components';
import { chatsActionsStore } from '@modules/chat/stores/chats';
import { useFocusEffect } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

export const ChatProfileMembersTab = observer(() => {
	const {
		members: { data, status },
		getMembersAction
	} = chatsActionsStore;

	const route = useRoute<"ChatProfile">();
	const { selectedChat } = route.params;

	useFocusEffect(
		useCallback(() => {
			getMembersAction(selectedChat);
		}, [])
	);

	return (
		<Box>
			<AsyncDataRender
				data={data?.members}
				status={status}
				renderContent={() => {
					return (
						<Box
							flex={1}
							width={"100%"}
						>
							{data?.members?.map((member) => (
								<MemberItem
									key={member.user_id}
									member={member}
								/>
							))}
						</Box>
					);
				}}
			/>
		</Box>
	);
});
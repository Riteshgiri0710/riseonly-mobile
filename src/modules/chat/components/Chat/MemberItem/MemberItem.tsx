import { Box, MainText, SimpleButtonUi, UserLastSeenUi, UserLogo, UserNameAndBadgeUi } from '@core/ui';
import { HoldItem } from '@core/ui/HoldMenu';
import { onlineServices } from '@core/stores/online';
import { navigate, useRoute } from '@lib/navigation';
import { MESSAGE_HOLD_CONTEXT_MENU_WIDTH } from '@modules/chat/shared/config/const';
import { getMemberContextMenuActions } from '@modules/chat/shared/config/context-menu-data';
import { ProtoChatMember } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { profileStore } from '@modules/user/stores/profile';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export interface MemberItemProps {
	member: ProtoChatMember;
}

export const MemberItem = observer(({
	member
}: MemberItemProps) => {
	const { currentTheme } = themeStore;
	const { t } = useTranslation();
	const { profile } = profileStore;

	const route = useRoute();
	const { selectedChat }: any = route.params || {};

	const onMemberPress = useCallback(() => {
		// TODO: navigate to favourites chat
		if (member.user.id === profile?.id) return;

		navigate(
			"ChatProfile", {
			chatId:
				undefined,
			userId: member.user.id,
			tag: member.user.tag,
			selectedChat: undefined,
			previewUser: member.user
		}
		);
	}, [member.user.id, profile?.id]);

	const menuItems = useMemo(() => {
		return getMemberContextMenuActions(t, member.user as any);
	}, [t, member.user]);

	return (
		<SimpleButtonUi
			style={{ width: '100%' }}
			onPress={onMemberPress}
		>
			<HoldItem
				items={menuItems}
				menuAnchorPosition="top-right"
				disableMove={false}
				menuWidth={MESSAGE_HOLD_CONTEXT_MENU_WIDTH + 10}
				menuOffset={{ x: -20, y: 0 }}
			>
				<Box
					collapsable={false}
					style={{ overflow: 'visible', width: '100%', paddingVertical: 4.5 }}
				>
					<Box
						style={{
							paddingHorizontal: 5,
						}}
						width={"100%"}
						fD="row"
					>
						<Box
							centered
							style={{ paddingRight: 10 }}
						>
							<UserLogo
								source={member.user.avatar_url}
								size={42.5}
								isOnline={onlineServices.getEffectiveStatus(member.user.id, member.user).is_online}
							/>
						</Box>

						<Box
							height={"100%"}
							flex={1}
							justify="space-between"
							fD="row"
							align="center"
						>
							<Box
								justify="center"
							>
								<UserNameAndBadgeUi
									onlyUserName
									user={member.user as any}
									px={16}
								/>
								<UserLastSeenUi
									user={member.user as any}
									selectedChat={selectedChat}
								/>
							</Box>

							<Box
								justify="center"
							>
								<MainText
									numberOfLines={1}
								>
									{member.custom_title}
								</MainText>
							</Box>
						</Box>
					</Box>
				</Box>
			</HoldItem>

			<Box
				style={{
					paddingLeft: 20,
				}}
				width={"100%"}
				fD="row"
			>
				<Box
					style={{ paddingRight: 10 }}
					width={45}
				/>
				<Box
					style={{
						borderBottomWidth: 0.3,
						borderBottomColor: currentTheme.border_100,
					}}
					height={"100%"}
					flex={1}
				/>
			</Box>
		</SimpleButtonUi>
	);
});

const s = StyleSheet.create({
	container: {}
});
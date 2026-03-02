import { onlineServices } from '@core/stores/online';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { ChatTopBarLastSeen } from 'src/modules/chat/components/Chat/Bar/ChatTopBar/ChatTopBarLastSeen';
import { ChatInfo } from 'src/modules/chat/stores/chats';
import { MainText } from '../MainText/MainText';
import { SecondaryText } from '../SecondaryText/SecondaryText';

interface UserLastSeenUiProps {
	user?: any;
	selectedChat?: ChatInfo;
}

export const UserLastSeenUi = observer(({
	user,
	selectedChat
}: UserLastSeenUiProps) => {
	const { t } = useTranslation();

	const finalUser = user ?? selectedChat?.participant;
	const userId = finalUser?.id ?? finalUser?.findByKey?.('id');
	const { is_online: isOnline, last_seen: lastSeen } = onlineServices.getEffectiveStatus(userId, finalUser);

	return (
		<>
			{isOnline ? (
				<MainText
					primary
					px={12}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{t("online_status")}
				</MainText>
			) : lastSeen ? (
				<ChatTopBarLastSeen
					timestamp={lastSeen}
					isOnline={isOnline}
					updateInterval={1000}
				/>
			) : (
				<SecondaryText
					px={12}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{t("last_seen_recently")}
				</SecondaryText>
			)}
		</>
	);
});
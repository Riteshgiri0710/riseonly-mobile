import { TypingAnimation } from '@animations/components/TypingAnimation';
import { getSystemMessageType } from '@core/config/const';
import { MainText, SecondaryText } from '@core/ui';
import { checker } from '@lib/helpers';
import { ChatInfo } from '@modules/chat/stores/chats';
import { themeStore } from '@modules/theme/stores';
import { profileStore } from '@modules/user/stores/profile';
import { useTranslation } from 'react-i18next';

interface ChatItemContentProps {
	item?: ChatInfo | null;
}

export const ChatItemContent = ({ item }: ChatItemContentProps) => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const { t } = useTranslation();

	checker(item, "item");

	return (
		<>
			{item.typing_datas && item.typing_datas.length > 0 ? (
				<TypingAnimation
					typing_datas={item.typing_datas}
					type={item.type}
					width={5}
					fontSize={13}
					height={10}
					color={currentTheme.primary_100}
					isChat
				/>
			) : (
				(!item.last_message?.is_system_message && item.type !== "CHANNEL" && item.type !== "GROUP") ? (
					<MainText
						numberOfLines={2}
						ellipsizeMode="tail"
						px={13}
					>
						{item.last_message && (item.last_message.sender?.id === profile?.id) && (
							<MainText>{t("chat_last_message_yourself")}: </MainText>
						)}
						<SecondaryText px={14}>
							{item.last_message?.content || t("no_messages_yet") || ''}
						</SecondaryText>
					</MainText>
				) : item.last_message?.content && (
					<SecondaryText
						numberOfLines={2}
						px={14}
						ellipsizeMode="tail"
					>
						{getSystemMessageType(item.last_message?.content, t)}
					</SecondaryText>
				)
			)}
		</>
	);
};
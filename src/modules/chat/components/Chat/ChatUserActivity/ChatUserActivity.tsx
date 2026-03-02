import { TypingAnimation } from '@animations/components/TypingAnimation';
import { Box, MainText, UserLastSeenUi } from '@core/ui';
import { useRoute } from '@lib/navigation';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

export const ChatUserActivity = observer(() => {
	const { t } = useTranslation();
	const route = useRoute();

	const { previewUser, selectedChat }: any = route.params || {};

	if (selectedChat?.type === "FAVOURITES") return null;

	return (
		<Box>
			{selectedChat && selectedChat.typing_datas && selectedChat.typing_datas.length > 0 ? (
				<TypingAnimation
					width={5}
					fontSize={12}
					height={10}
					typing_datas={selectedChat.typing_datas}
					type={selectedChat.type}
					isChat
				/>
			) : selectedChat?.type === "CHANNEL" ? (
				<MainText
					numberOfLines={1}
					ellipsizeMode="tail"
					secondary
					px={13}
				>
					{t(`subscribers_count.${getPluralForm(selectedChat?.member_count || 1)}`, { count: selectedChat?.member_count || 1 })}
				</MainText>
			) : selectedChat?.type != "PRIVATE" && !previewUser ? ( // IF CHAT IS PRIVATE AND TYPING FALSE
				<MainText
					numberOfLines={1}
					ellipsizeMode="tail"
					secondary
					px={13}
					style={{ marginBottom: 3 }}
				>
					{t(`members_count.${getPluralForm(selectedChat?.member_count || 1)}`, { count: selectedChat?.member_count || 1 })}
				</MainText>
			) : ( // IF CHAT IS NOT PRIVATE AND TYPING FALSE
				<UserLastSeenUi
					user={selectedChat?.participant}
					selectedChat={selectedChat}
				/>
			)}
		</Box>
	);
});

const getPluralForm = (count: number): string => {
	if (count === 1) return 'one';
	if (count === 2) return 'few';
	if (count === 3) return 'few';
	if (count === 4) return 'few';
	if (count === 5) return 'many';
	return 'many';
};

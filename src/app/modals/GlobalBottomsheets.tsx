import { PreviewInviteLinkChatBottomSheet } from '@modules/chat/widgets/bottomsheets/PreviewInviteLinkChat/PreviewInviteLinkChat';
import { observer } from 'mobx-react-lite';

export const GlobalBottomSheets = observer(() => {
	return (
		<>
			<PreviewInviteLinkChatBottomSheet />
		</>
	);
});

import { MainText } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';

interface UserFriendsProps { isUser?: boolean; }

export const UserFriends = observer(({
	isUser = false
}: UserFriendsProps) => {
	return (
		<ProfileSettingsWrapper
			tKey='user_friends_text'
		>
			<MainText>user friends</MainText>
		</ProfileSettingsWrapper>
	);
});
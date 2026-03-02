
import { MainText } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';

interface UserSubscribersProps { isUser?: boolean; }

export const UserSubscribers = observer(({
	isUser = false
}: UserSubscribersProps) => {
	return (
		<ProfileSettingsWrapper
			tKey='user_subscribers_text'
		>
			<MainText>user subscribers</MainText>
		</ProfileSettingsWrapper>
	);
});
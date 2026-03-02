import { MainText } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';

interface UserSubsProps { isUser?: boolean; }

export const UserSubs = observer(({
	isUser = false
}: UserSubsProps) => {
	return (
		<ProfileSettingsWrapper
			tKey='user_subs_text'
		>
			<MainText>user subs</MainText>
		</ProfileSettingsWrapper>
	);
});
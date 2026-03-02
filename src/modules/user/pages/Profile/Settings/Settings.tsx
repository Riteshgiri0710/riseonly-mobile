import { Box, GroupedBtns, SecondaryText, UserLogo, UserNameAndBadgeUi } from '@core/ui';
import { formatPhoneNumber } from '@lib/text';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { getSettingsBtns } from 'src/modules/user/shared/config/grouped-btns-data';
import { profileStore } from 'src/modules/user/stores/profile';

export const Settings = observer(() => {
	const settingsBtns = getSettingsBtns();

	return (
		<ProfileSettingsWrapper
			tKey='settings_page_title'
		>
			<Box
				fD="column"
				gap={20}
				style={{ marginTop: 10 }}
			>
				<ProfileTop />

				<GroupedBtns
					items={settingsBtns}
					leftFlex={0}
				/>
			</Box>
		</ProfileSettingsWrapper>
	);
});

export const ProfileTop = observer(() => {
	const { profile } = profileStore;

	return (
		<Box
			fD="row"
			gap={10}
			align="center"
			justify="center"
			style={{ paddingHorizontal: 5 }}
		>
			<Box>
				<UserLogo
					size={75}
					isMe
				/>
			</Box>

			<Box>
				<Box>
					<UserNameAndBadgeUi
						user={profile!}
						px={18}
					/>

					<SecondaryText
						px={15}
						numberOfLines={1}
					>
						{formatPhoneNumber(profile?.phone) || ''}
					</SecondaryText>

					<SecondaryText
						px={15}
						numberOfLines={1}
					>
						{profile?.tag ? `@${profile.tag}` : ''}
					</SecondaryText>
				</Box>
			</Box>
		</Box>
	);
});
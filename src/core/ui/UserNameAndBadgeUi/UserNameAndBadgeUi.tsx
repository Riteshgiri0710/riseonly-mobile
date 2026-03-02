import { getProfileStatuses } from '@core/config/tsx';
import { AuthorInfo } from '@core/config/types';
import { GetWho, MainText, PremiumIconUi } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { StyleSheet, View } from 'react-native';
import { User } from 'src/modules/user/stores/profile';

export const UserNameAndBadgeUi = observer(({
	user,
	px = 13,
	size = 17.5,
	primary = false,
	authorIcon = false,
	showPremIcon = true,
	onlyUserName = false,
	contentType,
	userNameColor,
	customName,
}: UserNameAndBadgeUiProps) => {
	if (!user) {
		console.warn('User not provided in UserNameAndBadgeUi');
		return null;
	}

	if (contentType === "image") return null;

	return (
		<View style={styles.container}>
			<View style={styles.names}>
				<MainText
					px={px}
					primary={primary}
					numberOfLines={1}
					color={userNameColor}
				>
					{customName || user.name}
				</MainText>

				{!onlyUserName && (
					<>
						<GetWho who={user.more.who} marginTop={2} />
						{getProfileStatuses("ts", size)}
						{showPremIcon && <PremiumIconUi isPremium={(user.more as any).isPremium} size={size} />}
					</>
				)}
			</View>
		</View>
	);
});

interface UserNameAndBadgeUiProps {
	contentType?: string;
	authorIcon?: boolean;
	customName?: string;
	user: AuthorInfo | User;
	px?: number;
	size?: number;
	primary?: boolean;
	showPremIcon?: boolean;
	onlyUserName?: boolean;
	userNameColor?: string;
}

const styles = StyleSheet.create({
	names: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});
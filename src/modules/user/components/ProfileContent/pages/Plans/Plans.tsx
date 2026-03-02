import { Box, MainText, SimpleButtonUi } from '@core/ui';
import { EditIcon } from '@icons/Ui/EditIcon';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';

export const Plans = observer(() => {
	const { currentTheme } = themeStore;
	const {
		openedPage: { openedPage },
		profile
	} = profileStore;

	const { t } = useTranslation();

	useEffect(() => {
		if (openedPage !== 2) return;
	}, [openedPage]);

	return (
		<Box
			style={styles.pageContainer}
			bgColor={currentTheme.bg_200}
		>
			<Box
				padding={10}
				display='flex'
				align='center'
				fD='row'
				gap={10}
			>
				<MainText px={18}>{t('profile_plans_title')}</MainText>

				<SimpleButtonUi
					centered
				>
					<EditIcon />
				</SimpleButtonUi>
			</Box>

			<Box style={styles.planWrapper}>
				{profile?.more?.plans?.map((plan, index) => (
					<Box
						key={index}
						padding={10}
						style={styles.planContainer}
					>
						<View
							style={[
								styles.planLeft,
								{ backgroundColor: currentTheme.btn_bg_300, }
							]}
						>
							<MainText px={20}>{index + 1}</MainText>
						</View>
						<View style={styles.planRight}>
							<MainText marginTop={5}>
								{plan}
							</MainText>
						</View>
					</Box>
				))}
			</Box>
		</Box>
	);
});

const styles = StyleSheet.create({
	planLeft: {
		width: 30,
		height: 30,
		borderRadius: 5,
		justifyContent: 'center',
		alignItems: 'center'
	},
	planWrapper: {
	},
	pageContainer: {
		flex: 1
	},
	planContainer: {
		flexDirection: 'row',
		gap: 10
	},
	planRight: {
	}
});
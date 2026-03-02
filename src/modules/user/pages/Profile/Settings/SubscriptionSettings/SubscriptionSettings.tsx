import { appName } from '@config/const';
import { getMonthsFromProductId } from '@config/ts';
import { Box, GroupedBtns, LoaderUi, MainText, PremiumIconUi, SecondaryText, SimpleButtonUi } from '@core/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { useIAP } from 'react-native-iap';
import { SuccessSubscriptionModal } from 'src/modules/subscription/widgets/modals';
import { themeStore } from 'src/modules/theme/stores';
import { getPremiumFeaturesBtns, getSubscriptionPlansBtns } from 'src/modules/user/shared/config/grouped-btns-data';
import { profileStore } from 'src/modules/user/stores/profile';
import { subscriptionInteractionsStore } from 'src/modules/user/stores/subscription';

export const SubscriptionSettings = observer(() => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const { cachedSubscriptions: { cachedSubscriptions }, } = subscriptionInteractionsStore;

	const { t } = useTranslation();

	const isPremium = profile?.is_premium || false;
	const subscriptionEnd = profile?.subscription_end_date;
	const subscriptionStatus = profile?.subscription_status || 'none';

	const subscriptionPlans = getSubscriptionPlansBtns(cachedSubscriptions, t);
	const premiumFeatures = getPremiumFeaturesBtns(t);

	return (
		<ProfileSettingsWrapper
			tKey='subscription_title'
			height={0}
			requiredBg={false}
			bgColor={currentTheme.bg_100}
			PageHeaderUiStyle={{ backgroundColor: "transparent" }}
			needScrollView={false}
			onlyLayout
			marginBottom={0}
		>
			<>
				<ScrollView
					showsVerticalScrollIndicator={false}
				>
					<Box
						gap={30}
						width={"100%"}
					>
						{/* Premium Status Card */}
						<Box
							centered
							gap={5}
							width={"100%"}
						>
							<PremiumIconUi
								size={120}
								isPremium={isPremium}
								isStatic
							/>

							<MainText
								px={30}
								fontWeight="bold"
							>
								{appName} Premium
							</MainText>
						</Box>

						{/* Subscription Plans */}
						<GroupedBtns
							items={subscriptionPlans}
							groupGap={0}
						/>

						{/* Premium Features */}
						<GroupedBtns
							items={premiumFeatures}
							leftFlex={0}
						/>

						{/* Info Text */}
						<Box>
							<SecondaryText px={11} tac='center'>
								{t('subscription_info_text')}
							</SecondaryText>
							<SecondaryText px={11} tac='center'>
								{t('subscription_cancel_anytime')}
							</SecondaryText>
						</Box>
					</Box>
				</ScrollView>

				<BottomBar />

				<SuccessSubscriptionModal />
			</>
		</ProfileSettingsWrapper>
	);
});

const BottomBar = observer(() => {
	const { currentTheme } = themeStore;
	const {
		selectedSubscription: { selectedSubscription },
		buyLoading: { buyLoading },
		handleBuySubscription
	} = subscriptionInteractionsStore;

	const { t } = useTranslation();
	const { requestSubscription, finishTransaction } = useIAP();

	const buySubscriptionHandler = () => handleBuySubscription(requestSubscription, finishTransaction);

	return (
		<Box
			style={s.bottomBar}
			bgColor={currentTheme.bg_200}
		>
			<SimpleButtonUi
				onPress={buySubscriptionHandler}
				style={s.subscribeButton}
				bgColor={currentTheme.primary_100}
				disabled={!selectedSubscription}
			>
				{buyLoading ? (
					<LoaderUi
						color={currentTheme.text_100}
						size={"small"}
					/>
				) : (
					<MainText
						fontWeight="600"
						px={18}
						numberOfLines={1}
					>
						{(() => {
							const months = getMonthsFromProductId((selectedSubscription as any)?.productId || '');
							return t(
								`${months}month_subscription_buy_text`,
								{ price: (selectedSubscription as any)?.localizedPrice || '' }
							);
						})()}
					</MainText>
				)}
			</SimpleButtonUi>
		</Box>
	);
});

const s = StyleSheet.create({
	bottomBar: {
		width: "100%",
		height: 50,
	},
	subscribeButton: {
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
		width: "100%",
		paddingHorizontal: 20,
	},
	manageButton: {
		borderRadius: 12,
		padding: 16,
		alignItems: 'center',
	},
	infoBox: {
		borderRadius: 12,
		padding: 15,
		marginBottom: 20,
	},
});
import { cachedDataTitles } from '@config/ts';
import { AnimatedTabs, Box, InDevUi, TabConfig } from '@core/ui';
import { checker, logger } from '@lib/helpers';
import { SelectedCachedDataT, memoryStore } from '@stores/memory';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';
import { AllChats } from 'src/modules/chat/components/Tabs/AllChats/AllChats';
import { themeStore } from 'src/modules/theme/stores';

export const CachedChats = observer(() => {
	const { currentTheme } = themeStore;
	const {
		selectedCachedData: { selectedCachedData },
	} = memoryStore;

	const { t } = useTranslation();
	const height = useWindowDimensions().height;

	checker(!!selectedCachedData, "Selected cached data is not defined");

	const chatTabs: TabConfig[] = [
		{
			text: t("all_chats"),
			content: observer(() => (
				<AllChats
					cached
					chatCallback={(item) => {
						logger.info("CachedChats", item.id);
					}}
				/>
			))
		},
		{
			text: t("other"),
			content: observer(() => {
				return (
					<Box
						flex={1}
						centered
						bgColor={currentTheme.bg_200}
					>
						<InDevUi />
					</Box>
				);
			})
		}
	];

	return (
		<ProfileSettingsWrapper
			title={`${t("cache")} | ${t(cachedDataTitles[selectedCachedData as SelectedCachedDataT])}`}
			requiredBg={false}
			bgColor={currentTheme.bg_200}
			PageHeaderUiStyle={{
				backgroundColor: currentTheme.btn_bg_300
			}}
			height={38}
			wrapperNoPadding
			needScrollView={false}
		>
			<Box
				flex={1}
				minHeight={height}
				bgColor={currentTheme.btn_bg_300}
			>
				<AnimatedTabs
					noBorderRadius={true}
					blurView
					tabs={chatTabs}
					bouncing={false}
					contentContainerStyle={{ height: "100%", flex: 1 }}
				/>
			</Box>
		</ProfileSettingsWrapper >
	);
});
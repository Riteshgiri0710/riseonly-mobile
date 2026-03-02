import { getMemoryUsageChartsData } from '@config/ts';
import { Box, GroupedBtns, MainText, MemoryUsageChart, SecondaryText, SimpleButtonUi } from '@core/ui';
import { formatBytes } from '@lib/text';
import { memoryServiceStore, memoryStore } from '@stores/memory';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';
import { getCachedDataBtns, getMemorySettingsBtns, getMemoryUsageBtns } from 'src/modules/user/shared/config/grouped-btns-data';

export const MemorySettings = observer(() => {
	const { currentTheme } = themeStore;
	const { clearAllCache } = memoryServiceStore;
	const {
		memoryUsage,
		calculateMemoryUsage
	} = memoryStore;

	const { t } = useTranslation();

	const chartData = useMemo(() => getMemoryUsageChartsData(memoryUsage), [memoryUsage]);
	const memoryUsageItems = useMemo(() => getMemoryUsageBtns(t, memoryUsage), [t, memoryUsage]);
	const cachedDataBtns = useMemo(() => getCachedDataBtns(t), [t]);
	const autoDeleteButtons = useMemo(() => getMemorySettingsBtns(t), [t]);

	useEffect(() => { calculateMemoryUsage(); }, []);

	return (
		<ProfileSettingsWrapper
			tKey='settings_memory_title'
			requiredBg={false}
			bgColor={currentTheme.bg_200}
			PageHeaderUiStyle={{
				backgroundColor: currentTheme.btn_bg_300
			}}
			height={45}
		>
			<Box
				flex={1}
				width={"100%"}
				gap={20}
				style={styles.container}
			>
				<View style={styles.chartContainer}>
					<Box width={"100%"} centered>
						<MemoryUsageChart
							total={memoryUsage.total}
							segments={chartData || []}
							size={180}
						/>
						<SecondaryText
							style={styles.usageText}
							px={14}
						>
							{t('memory_settings_usage_text', {
								percentage: formatBytes(memoryUsage.total)
							})}
						</SecondaryText>
					</Box>
				</View>

				<Box
					style={styles.usageList}
					bgColor={currentTheme.bg_200}
					flex={1}
					width={"100%"}
				>
					<GroupedBtns
						leftFlex={0}
						items={memoryUsageItems}
						groupBg={currentTheme.btn_bg_300}
					/>
				</Box>

				<SimpleButtonUi
					style={[styles.clearButton, { backgroundColor: currentTheme.primary_100 }]}
					onPress={clearAllCache}
				>
					<MainText
						style={styles.clearButtonText}
						numberOfLines={1}
					>
						{t('memory_settings_clear_all', { size: formatBytes(memoryUsage.total) })}
					</MainText>
				</SimpleButtonUi>

				<Box flex={1}>
					<GroupedBtns
						items={cachedDataBtns}
						leftFlex={0}
						groupBg={currentTheme.btn_bg_300}
					/>
				</Box>

				<Box flex={1}>
					<GroupedBtns
						items={autoDeleteButtons}
						leftFlex={0}
						groupBg={currentTheme.btn_bg_300}
					/>
				</Box>
			</Box>
		</ProfileSettingsWrapper>
	);
});

const styles = StyleSheet.create({
	container: {
		paddingBottom: 50
	},
	chartContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		width: "100%",
	},
	usageText: {
		paddingHorizontal: 5,
		marginTop: 10,
		textAlign: 'center',
		fontSize: 14,
		width: "100%",
	},
	usageList: {
		borderRadius: 10,
		overflow: 'hidden',
	},
	clearButton: {
		height: 45,
		paddingHorizontal: 10,
		borderRadius: 10,
		width: "100%",
		alignItems: 'center',
		justifyContent: 'center',
	},
	clearButtonText: {
		fontWeight: '500',
		fontSize: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 8,
	},
});

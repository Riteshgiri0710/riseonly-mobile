import { HoldContextMenuAction } from '@core/ui';
import { localStorage } from '@storage/index';
import { MemoryUsageStats } from '@stores/memory';
import i18next, { TFunction } from 'i18next';
import { GetPostFeedResponse } from 'src/modules/post/stores';
import { profileStore } from 'src/modules/user/stores/profile';
import { defaultLogo, showNotify } from './const';
import { AuthorInfo } from './types';

export async function getCachedData(key: string) {
	return await localStorage.get(key);
}

export const getPostTags = () => {
	const res = [
		i18next.t("IT"), i18next.t("posttag_memes"), i18next.t("posttag_selfimprove"),
		i18next.t("posttag_science"), i18next.t("posttag_coding"),
		i18next.t("posttag_comedy"), i18next.t("posttag_games"), i18next.t("posttag_anime"),
		i18next.t("posttag_sport"), i18next.t("posttag_music"), i18next.t("posttag_movies"),
		i18next.t("posttag_technology"), i18next.t("posttag_travel"),
		i18next.t("posttag_food"), i18next.t("posttag_fashion"), i18next.t("posttag_art"),
		i18next.t("posttag_history")
	];
	return res;
};

export const defaultContextMenuActions: HoldContextMenuAction[] = [
	{
		icon: "content-copy",
		title: "Скопировать",
		onPress: () => {
			showNotify("system", { message: "Вы не добавили actions" });
		}
	},
	{
		icon: "reply",
		title: "Ответить (Test)",
		onPress: () => {
			showNotify("system", { message: "Вы не добавили actions" });
		}
	},
	{
		icon: "content-copy",
		title: "Скопировать (Test)",
		onPress: () => {
			showNotify("system", { message: "Вы не добавили actions" });
		}
	},
	{
		icon: "reply",
		title: "Ответить (Test)",
		onPress: () => {
			showNotify("system", { message: "Вы не добавили actions" });
		}
	},
	{
		icon: "delete",
		title: "Удалить",
		onPress: () => {
			showNotify("system", { message: "Вы не добавили actions" });
		}
	}
];

export const memoryUsageColors = {
	video: '#4B96FC',
	image: '#FF3B30',
	photo: "#80ff00",
	file: '#00fffb',
	story: '#a600ff',
	audio: '#34C759',
	other: '#FF9500'
};

export const cachedDataTitles = {
	personal_chats: "memory_settings_personal_chats",
	groups: "memory_settings_groups",
	profiles: "memory_settings_profiles"
};

export const getMemoryUsageChartsData = (memoryUsage: MemoryUsageStats) => {
	const total = memoryUsage.total;
	if (total === 0) return [];

	return [
		{
			value: memoryUsage.videos,
			color: memoryUsageColors.video,
			percentage: (memoryUsage.videos / total) * 100
		},
		{
			value: memoryUsage.images,
			color: memoryUsageColors.image,
			percentage: (memoryUsage.images / total) * 100
		},
		{
			value: memoryUsage.photos,
			color: memoryUsageColors.photo,
			percentage: (memoryUsage.photos / total) * 100
		},
		{
			value: memoryUsage.files,
			color: memoryUsageColors.file,
			percentage: (memoryUsage.files / total) * 100
		},
		{
			value: memoryUsage.stories,
			color: memoryUsageColors.story,
			percentage: (memoryUsage.stories / total) * 100
		},
		{
			value: memoryUsage.audio,
			color: memoryUsageColors.audio,
			percentage: (memoryUsage.audio / total) * 100
		},
		{
			value: memoryUsage.other,
			color: memoryUsageColors.other,
			percentage: (memoryUsage.other / total) * 100
		}
	].filter(segment => segment.value > 0);
};

export const getPreviewPost = (previewText: string, t: TFunction) => {
	return {
		id: 77777777777777,
		author: { ...profileStore?.profile, more: (profileStore?.profile?.more) as any } as AuthorInfo,
		author_id: profileStore?.profile?.id || "asd",
		title: t("preview_post_title"),
		content: previewText,
		original_сontent: previewText,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		likes_count: 0,
		comments_count: 0,
		favorites_count: 0,
		images: [profileStore?.profile?.more?.logo || defaultLogo],
		tags: ["IT"],
		hashtags: ["hello", "every", "one"]
	} as unknown as GetPostFeedResponse;
};

export const getReactivePreviewPost = (values: any, inpHashtags: string) => {
	return {
		id: 77777777777777,
		author: { ...profileStore?.profile, more: (profileStore?.profile?.more) as any } as AuthorInfo,
		author_id: profileStore?.profile?.id || "asd",
		title: values.title,
		content: values.content,
		original_content: values.originalContent,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		likes_count: 0,
		comments_count: 0,
		favorites_count: 0,
		images: values.images as string[],
		tags: values.tags as string[],
		hashtags: inpHashtags ? inpHashtags.replaceAll("#", "").split(" ") : []
	} as unknown as GetPostFeedResponse;
};

export const getMonthsFromProductId = (productId: string): number => {
	if (productId.includes('1month')) return 1;
	if (productId.includes('3month')) return 3;
	if (productId.includes('6month')) return 6;
	if (productId.includes('12month')) return 12;
	return 1;
};

export const getSubscriptionPeriodLabel = (months: number, t: TFunction): string => {
	if (months === 1) return t('subscription_1month_period');
	if (months === 3) return t('subscription_3months_period');
	if (months === 6) return t('subscription_6months_period');
	if (months === 12) return t('subscription_12months_period');
	return t('subscription_1month_period');
};

export const getSubscriptionPeriodPrice = (months: number, t: TFunction): string => {
	const obj = {
		1: 'subscription_per_month',
		6: 'subscription_per_6months',
		12: 'subscription_per_12months',
	};

	return t(obj[months as keyof typeof obj]);
};

export const formatSubscriptionPrice = (price: number, thousandSeparator: string, decimalSeparator: string, currency: string) => {
	const priceStr = price.toFixed(2);
	const [integer, decimal] = priceStr.split('.');
	const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
	return `${formattedInteger}${decimalSeparator}${decimal}${currency}`;
};

export const getSubscriptionData = (subscription: any) => {
	const sortedPlans = subscription
		.slice()
		.sort((a: any, b: any) => {
			const localizedPriceA = (a as any).localizedPrice || '';
			const localizedPriceB = (b as any).localizedPrice || '';

			const priceNumberA = parseFloat(localizedPriceA.replace(/[^0-9.,]/g, '').replace(',', '.'));
			const priceNumberB = parseFloat(localizedPriceB.replace(/[^0-9.,]/g, '').replace(',', '.'));

			return priceNumberA - priceNumberB;
		});

	const cheapPlan = sortedPlans[0];
	const cheapPlanPrice = (cheapPlan as any)?.localizedPrice || '';

	const currency = cheapPlanPrice.replace(/[0-9.,\s]/g, '');
	const hasCommaDecimal = cheapPlanPrice.indexOf(',') > cheapPlanPrice.lastIndexOf('.');
	const thousandSeparator = hasCommaDecimal ? '.' : ',';
	const decimalSeparator = hasCommaDecimal ? ',' : '.';

	const cheapPlanPriceString = cheapPlanPrice.replace(/[^0-9.,]/g, '');
	const cheapPlanPriceNumber = parseFloat(
		cheapPlanPriceString.replace(new RegExp('\\' + thousandSeparator, 'g'), '').replace(decimalSeparator, '.')
	);

	const cheapPlanHalfYearPrice = cheapPlanPriceNumber * 6;
	const cheapPlanYearPrice = cheapPlanPriceNumber * 12;

	return {
		decimalSeparator,
		thousandSeparator,
		cheapPlan,
		cheapPlanPrice,
		cheapPlanPriceNumber,
		cheapPlanHalfYearPrice,
		cheapPlanYearPrice,
		currency,
		sortedPlans
	};
};
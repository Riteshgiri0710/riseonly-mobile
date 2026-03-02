import { Box, MainText } from '@core/ui';
import { parseTimestamp } from '@lib/date/index';
import { format, isSameYear, isToday, isYesterday } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import i18n from 'i18n';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

interface DateSeparatorProps {
	timestamp: number;
	isSticky?: boolean;
}

export const DateSeparator = observer(({ timestamp, isSticky = false }: DateSeparatorProps) => {
	const { currentTheme } = themeStore;
	const date = parseTimestamp(timestamp);
	const currentLanguage = i18n.language || 'ru';
	const locale = currentLanguage === 'ru' ? ru : enUS;

	const getFormattedDate = () => {
		const relativeDateTexts = {
			ru: { today: 'Сегодня', yesterday: 'Вчера' },
			en: { today: 'Today', yesterday: 'Yesterday' },
		};

		const relativeTexts = (relativeDateTexts as any)[currentLanguage] || relativeDateTexts.en;

		if (isToday(date)) return relativeTexts.today;
		if (isYesterday(date)) return relativeTexts.yesterday;
		if (isSameYear(date, new Date())) return format(date, 'd MMMM', { locale });

		return format(date, 'd MMMM yyyy', { locale });
	};

	return (
		<Box
			style={[
				s.container,
				isSticky && s.sticky
			]}
		>
			<Box
				style={s.dateContainer}
				bgColor={currentTheme.bg_200}
				bRad={30}
			>
				<MainText
					px={13}
				>
					{getFormattedDate() || ''}
				</MainText>
			</Box>
		</Box>
	);
});

const s = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 10,
		paddingHorizontal: 10,
		width: '100%',
		zIndex: 1,
		justifyContent: 'center'
	},
	sticky: {
	},
	dateContainer: {
		paddingHorizontal: 8.5,
		paddingVertical: 4,
	},
	line: {
		height: 0.5,
		flex: 1,
	}
}); 
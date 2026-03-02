import { SecondaryText } from '@core/ui';
import { changeRgbA } from '@lib/theme';
import { Pressable, Text, View } from 'react-native';
import type { PackRecord } from './types';
import { sectionHeaderStyles } from './styles';

interface SectionHeaderProps {
	pack: PackRecord;
	backgroundColor?: string;
	textColor: string;
	/** Show "Edit" button (pack admin only) */
	isAdmin?: boolean;
	onEditPress?: () => void;
}

export function SectionHeader({ pack, backgroundColor, textColor, isAdmin, onEditPress }: SectionHeaderProps) {
	return (
		<View style={[sectionHeaderStyles.header, { backgroundColor }]}>
			<Text
				style={[sectionHeaderStyles.title, { color: textColor }]}
				numberOfLines={1}
			>
				{pack.title}
			</Text>
			{isAdmin && onEditPress ? (
				<Pressable onPress={onEditPress} hitSlop={8} style={sectionHeaderStyles.editBtn}>
					<SecondaryText style={sectionHeaderStyles.editBtnText}>Изменить</SecondaryText>
				</Pressable>
			) : null}
		</View>
	);
}

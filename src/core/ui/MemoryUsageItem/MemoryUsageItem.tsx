import { formatBytes, formatPercent } from '@lib/text';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

interface MemoryUsageItemProps {
	title: string;
	size: number;
	percentage: number;
	color: string;
	onPress?: () => void;
}

export const MemoryUsageItem: React.FC<MemoryUsageItemProps> = ({
	title,
	size,
	percentage,
	color,
	onPress
}) => {
	return (
		<TouchableOpacity
			style={styles.container}
			onPress={onPress}
			disabled={!onPress}
		>
			<View style={styles.content}>
				<View style={[styles.colorIndicator, { backgroundColor: color }]} />
				<Text
					style={[
						styles.title,
						{ color: themeStore.currentTheme.text_100 }
					]}
				>
					{title}
				</Text>
			</View>
			<View style={styles.stats}>
				<Text style={[styles.size, { color: themeStore.currentTheme.text_100 }]}>
					{formatBytes(size)}
				</Text>
				<Text style={[styles.percentage, { color: themeStore.currentTheme.secondary_100 }]}>
					{formatPercent(percentage)}
				</Text>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
		paddingHorizontal: 16,
		width: "100%",
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	colorIndicator: {
		width: 28,
		height: 28,
		borderRadius: 8,
		marginRight: 12,
	},
	title: {
		fontSize: 16,
		fontWeight: '500',
	},
	stats: {
		alignItems: 'flex-end',
	},
	size: {
		fontSize: 16,
		fontWeight: '500',
	},
	percentage: {
		fontSize: 14,
		marginTop: 2,
	}
}); 
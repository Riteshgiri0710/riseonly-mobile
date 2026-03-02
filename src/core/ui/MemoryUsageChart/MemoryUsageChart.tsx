import { DoneAnimation } from '@animations/components/DoneAnimation';
import { formatBytes } from '@lib/text';
import { observer } from 'mobx-react-lite';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { themeStore } from 'src/modules/theme/stores';
import { Box } from '../BoxUi/Box';
import { MainText } from '../MainText/MainText';

interface MemoryUsageChartProps {
	total: number;
	segments: {
		value: number;
		color: string;
		percentage: number;
	}[];
	size?: number;
}

export const MemoryUsageChart = observer(({
	total,
	segments,
	size = 200
}: MemoryUsageChartProps) => {
	const { currentTheme } = themeStore;
	const radius = size / 2;
	const strokeWidth = radius * 0.3;
	const innerRadius = radius - strokeWidth;
	const circumference = 2 * Math.PI * innerRadius;

	const hasNonZeroSegments = segments.some(segment => segment.value > 0 && segment.percentage > 0);
	const showFullCircle = !hasNonZeroSegments || (segments.length === 1 && segments[0].percentage === 100);

	const renderSegments = () => {
		if (!segments || segments.length === 0) return null;

		const validSegments = segments.filter(segment => segment.value > 0 && segment.percentage > 0);

		if (validSegments.length === 0) return null;

		let accumulatedPercentage = 0;
		return validSegments.map((segment, index) => {
			const strokeDashoffset = circumference - (segment.percentage / 100) * circumference;
			const rotation = (accumulatedPercentage / 100) * 360;
			accumulatedPercentage += segment.percentage;

			return (
				<G key={index} rotation={rotation} origin={`${radius}, ${radius}`}>
					<Circle
						cx={radius}
						cy={radius}
						r={innerRadius}
						fill="transparent"
						stroke={segment.color}
						strokeWidth={strokeWidth}
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						strokeLinecap="butt"
					/>
				</G>
			);
		});
	};

	const formattedSize = formatBytes(total).split(' ')[0];
	const sizeUnit = formatBytes(total).split(' ')[1] || 'Б';

	return (
		<View style={[styles.container, { maxWidth: size, maxHeight: size }]}>
			{total === 0 ? (
				<Box>
					<DoneAnimation size={size * 2.5} />
				</Box>
			) : (
				<View style={{ width: size, height: size, position: 'relative' }}>
					<Svg width={size} height={size}>
						<Circle
							cx={radius}
							cy={radius}
							r={innerRadius}
							fill="transparent"
							stroke={currentTheme.bg_200}
							strokeWidth={strokeWidth}
						/>

						{showFullCircle ? (
							<Circle
								cx={radius}
								cy={radius}
								r={innerRadius}
								fill="transparent"
								stroke={segments[0]?.color || "#4B96FC"}
								strokeWidth={strokeWidth}
							/>
						) : (
							renderSegments()
						)}
					</Svg>
					<View style={[styles.textContainer, { width: size, height: size }]}>
						<MainText
							style={styles.totalText}
							px={20}
						>
							{formattedSize} {sizeUnit}
						</MainText>
					</View>
				</View>
			)}
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	textContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	totalText: {
		fontWeight: '600',
	},
	percentageText: {
		fontSize: 14,
		marginTop: 8,
	}
}); 
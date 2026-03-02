import { StyleSheet, Text, View } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

interface FormattedTextProps {
	text: string;
	style?: any;
}

export const FormattedText = ({ text, style }: FormattedTextProps) => {
	const { currentTheme } = themeStore;

	const segments = parseFormattedText(text);

	return (
		<View style={[styles.container, style]}>
			<Text style={{ color: currentTheme.text_100 }}>
				{segments.map((segment, index) => renderSegment(segment, index))}
			</Text>
		</View>
	);
};

const parseFormattedText = (text: string) => {
	const segments = [];
	let currentIndex = 0;

	const colorRegex = /:([A-Fa-f0-9]{6}):(.*?):/g;
	let match;

	while ((match = colorRegex.exec(text)) !== null) {
		if (match.index > currentIndex) {
			segments.push({
				type: 'plain',
				text: text.substring(currentIndex, match.index)
			});
		}

		segments.push({
			type: 'color',
			color: `#${match[1]}`,
			text: match[2]
		});

		currentIndex = match.index + match[0].length;
	}

	if (currentIndex < text.length) {
		segments.push({
			type: 'plain',
			text: text.substring(currentIndex)
		});
	}

	return segments;
};

const renderSegment = (segment: any, index: number) => {
	switch (segment.type) {
		case 'color':
			return (
				<Text key={index} style={{ color: segment.color }}>
					{segment.text}
				</Text>
			);
		default:
			return <Text key={index}>{segment.text}</Text>;
	}
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	}
}); 
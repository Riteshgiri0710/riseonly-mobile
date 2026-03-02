import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	container: {},
	scrollContent: {},
	textContainer: {},
	codeBlockContainer: {
		borderRadius: 8,
		overflow: 'hidden',
		flexDirection: 'row',
	},
	codeBlockLeftBar: {
		width: 4,
		borderRadius: 1.5
	},
	codeBlockHeader: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	codeBlockLanguage: {
		fontSize: 12,
		fontWeight: '600',
		letterSpacing: 0.5
	},
	codeBlockContent: {
		flex: 1,
	},
	codeBlockScrollView: {
		paddingHorizontal: 12,
		paddingBottom: 12,
		paddingTop: 0
	},
	codeBlockInner: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	codeBlockText: {
		lineHeight: 20
	}
});


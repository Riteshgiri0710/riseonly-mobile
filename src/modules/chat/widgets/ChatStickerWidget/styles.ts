import { StyleSheet } from 'react-native';
import {
	SETTINGS_BUTTON_INSET,
	SETTINGS_BUTTON_SIZE,
	TAB_LETTER_SIZE,
	SECTION_HEADER_HEIGHT,
	STICKER_ROW_GAP,
} from './types';

export const sectionHeaderStyles = StyleSheet.create({
	header: {
		height: SECTION_HEADER_HEIGHT,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 8,
		marginTop: 4,
		borderRadius: 8,
		width: '100%',
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
	},
	editBtn: {
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
	editBtnText: {
		fontSize: 14,
	},
});

export const stickerRowStyles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		justifyContent: 'flex-start',
		gap: STICKER_ROW_GAP,
		marginBottom: 4,
	},
	plusCell: {
		borderRadius: 15,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export const mainStyles = StyleSheet.create({
	container: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
	},
	blurWrapper: {
		...StyleSheet.absoluteFillObject,
	},
	blur: {
		flex: 1,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		borderWidth: 0.7,
		overflow: 'hidden',
	},
	content: {
		flex: 1,
		paddingHorizontal: 12,
		paddingTop: 0,
	},
	tabsRow: {
		height: TAB_LETTER_SIZE + 12,
	},
	tabsContent: {
		flexDirection: 'row',
		gap: 8,
		paddingVertical: 6,
	},
	tabLetter: {
		width: TAB_LETTER_SIZE,
		height: TAB_LETTER_SIZE,
		borderRadius: TAB_LETTER_SIZE / 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	tabLetterText: {
		fontSize: 18,
		fontWeight: '600',
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	listWrap: {
		flex: 1,
	},
	listContent: {
		paddingBottom: 4,
	},
	settingsButton: {
		position: 'absolute',
		bottom: SETTINGS_BUTTON_INSET + 5,
		right: 25,
		width: SETTINGS_BUTTON_SIZE,
		height: SETTINGS_BUTTON_SIZE,
		borderRadius: SETTINGS_BUTTON_SIZE / 2,
		overflow: 'hidden',
	},
	settingsBlur: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export const editPackModalStyles = StyleSheet.create({
	modalContent: {
		padding: 5,
		width: '100%',
	},
	inputContainer: {
		height: 45,
		paddingHorizontal: 15,
		width: '100%',
	},
	switchContainer: {
		borderRadius: 30,
		paddingVertical: 8,
		paddingHorizontal: 15,
	},
	errorText: {
		marginTop: -4,
	},
});

export const contextMenuStyles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	box: {
		minWidth: 220,
		borderRadius: 12,
		paddingVertical: 8,
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	label: {
		fontSize: 16,
	},
});

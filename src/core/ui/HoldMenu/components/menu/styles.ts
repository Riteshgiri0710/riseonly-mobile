import { StyleSheet } from 'react-native';
import { MENU_WIDTH } from '../../constants';
import styleGuide from '../../styleGuide';

const styles = StyleSheet.create({
	menuWrapper: {
		position: 'absolute',
		left: 0,
		zIndex: 9999,
		elevation: 9999,
	},
	menuContainer: {
		position: 'absolute',
		top: 0,
		width: MENU_WIDTH,
		borderRadius: 12,
		paddingVertical: 3,
		overflow: 'hidden',
		zIndex: 10000,
		elevation: 10000,
	},
	menuInnerContainer: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		alignItems: 'center',
	},
	menuItem: {
		paddingHorizontal: 17.5,
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: 40,
		gap: 10,
	},
	menuItemLabel: {
		paddingHorizontal: 17.5,
		width: '100%',
		height: 30,
		justifyContent: 'center',
		alignItems: 'flex-start',
	},
	menuItemLabelText: {
		fontSize: 10,
		lineHeight: 14,
	},
	border: {
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	menuItemText: {
		fontSize: styleGuide.typography.callout.fontSize,
		lineHeight: styleGuide.typography.callout.lineHeight,
		textAlign: 'left',
		width: '100%',
		flex: 1,
	},
	menuItemTitleText: {
		fontSize: styleGuide.typography.callout2.fontSize,
		lineHeight: styleGuide.typography.callout2.lineHeight,
		textAlign: 'center',
		width: '100%',
		flex: 1,
	},
	textDark: {
		color: 'black',
	},
	textLight: {
		color: 'white',
	},
});

export default styles;


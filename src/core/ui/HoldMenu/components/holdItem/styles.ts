import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	holdItem: { zIndex: 10000, position: 'absolute' },
	portalOverlay: {
		...StyleSheet.absoluteFillObject,
		zIndex: 10000,
	},
});

export default styles;


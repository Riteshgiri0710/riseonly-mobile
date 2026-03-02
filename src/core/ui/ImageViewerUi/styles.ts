import { Dimensions, StyleSheet } from 'react-native'

const { width, height } = Dimensions.get('window')
const btnsBRad = 7

export const styles = StyleSheet.create({
	main: {
		height: '100%',
		width: '100%',
		position: 'absolute',
		top: 0,
		left: 0,
		zIndex: 1000000,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},

	imageContainer: {
		height: '100%',
		width: '100%',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',
		gap: 7,
	},

	top: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 20,
		height: height * 0.2,
	},

	topleft: {
		width: '33%',
		display: 'flex',
		flexDirection: 'column',
		gap: 7,
	},

	names: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
	},

	left: {
		display: 'flex',
		flexDirection: 'column',
	},

	topmid: {
		width: '33%',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},

	topright: {
		width: '33%',
		display: 'flex',
		flexDirection: 'column',
		gap: 10,
		alignItems: 'flex-end',
	},

	right: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},

	mid: {
		width: '100%',
		height: height * 0.6,
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},

	arrowButton: {
		width: '7%',
		height: '100%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},

	swiper: {
		flex: 1,
		height: '100%',
	},

	swipeSlide: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100%',
	},

	bot: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end',
		gap: 10,
		height: height * 0.2,
	},

	bottop: {
		paddingHorizontal: 20,
	},

	content: {
		color: 'white',
	},

	botbot: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 20,
		paddingHorizontal: 20,
		paddingBottom: 30,
	},

	botright: {
		height: '100%',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 10,
	},

	btns: {
		display: 'flex',
	},

	btn: {
		height: '100%',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},

	botcontainer: {
		overflow: 'hidden',
		display: 'flex',
		flexDirection: 'row',
		gap: 10,
		flex: 1,
	},

	thumbSwiper: {
		width: '100%',
		height: 100,
	},

	botimg: {
		height: 100,
		justifyContent: 'center',
		alignItems: 'center',
	},

	active: {
		borderBottomWidth: 3,
		borderBottomColor: 'orange',
	},

	thumbImage: {
		height: '100%',
		width: '100%',
	},
}) 
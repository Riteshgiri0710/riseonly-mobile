import { MainText } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { StyleSheet, View } from 'react-native';

export const Goals = observer(() => (
	<View style={styles.pageContainer}>
		<MainText px={20}>Страница 3</MainText>
		<MainText>Здесь может быть информация о пользователе</MainText>
	</View>
));

const styles = StyleSheet.create({
	pageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
});
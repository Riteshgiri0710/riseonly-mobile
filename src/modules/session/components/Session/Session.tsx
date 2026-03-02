import { MainText } from '@core/ui';
import { StyleSheet, View } from 'react-native';
import { GetSessionsResponse } from 'src/modules/session/stores';

interface SessionProps {
	session: GetSessionsResponse;
}

export const Session = ({
	session
}: SessionProps) => {
	return (
		<View>
			<MainText>
				{session.device_info}
			</MainText>
		</View>
	);
};

const s = StyleSheet.create({

});
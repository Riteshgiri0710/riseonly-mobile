import sleepycat from "@animations/sleepcat.json"
import LottieView from 'lottie-react-native'
import { observer } from 'mobx-react-lite'
import { View } from 'react-native'

export const NoDataAnimation = observer(({
	size = 100
}: PremiumIconUiProps) => {
	const style = {
		width: size,
		height: size,
	}

	return (
		<View style={style}>
			<LottieView
				source={sleepycat}
				autoPlay
				loop
				speed={0.5}
				style={{ width: size, height: size }}
			/>
		</View>
	)
})

interface PremiumIconUiProps {
	size?: number
}
import narutoAnimation from "@animations/naruto.json"
import LottieView from 'lottie-react-native'
import { observer } from 'mobx-react-lite'
import { View } from 'react-native'

export const InDevelopmentAnimation = observer(({
	size = 100
}: PremiumIconUiProps) => {
	const style = {
		width: size,
		height: size,
	}

	return (
		<View style={style}>
			<LottieView
				source={narutoAnimation}
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
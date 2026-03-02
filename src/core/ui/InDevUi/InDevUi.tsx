import { InDevelopmentAnimation } from '@animations/components/InDevelopmentAnimation'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useWindowDimensions, View } from 'react-native'
import { Box } from '../BoxUi/Box'
import { MainText } from '../MainText/MainText'

export const InDevUi = observer(() => {
	const { width } = useWindowDimensions()
	const { t } = useTranslation()

	return (
		<Box
			flex={1}
			align='center'
			style={{
				position: "relative",
			}}
		>
			<View
				style={{ position: "absolute", top: 20, }}
			>
				<InDevelopmentAnimation size={200} />
				<MainText
					fontWeight="bold"
					px={20}
					tac='center'
					width={"100%"}
				>
					{t("in_development")}
				</MainText>
			</View>
		</Box>
	)
})
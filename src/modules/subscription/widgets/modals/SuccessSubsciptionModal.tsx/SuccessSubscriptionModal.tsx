import { ConfetiAnimation } from '@animations/components/ConfetiAnimation';
import { Box, CustomModalUi, MainText, PremiumIconUi } from '@core/ui';
import { haptics } from '@utils/haptics';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Portal } from 'react-native-paper';
import { themeStore } from 'src/modules/theme/stores';
import { subscriptionInteractionsStore } from 'src/modules/user/stores/subscription';

const TEXT_SIZE = 20;

export const SuccessSubscriptionModal = observer(() => {
	const { currentTheme } = themeStore;
	const {
		successSubscriptionModalOpen: { successSubscriptionModalOpen, setSuccessSubscriptionModalOpen }
	} = subscriptionInteractionsStore;

	const { t } = useTranslation();

	useEffect(() => {
		if (!successSubscriptionModalOpen) return;
		haptics.success();
	}, [successSubscriptionModalOpen]);

	return (
		<Portal>
			<CustomModalUi
				visible={successSubscriptionModalOpen}
				setVisible={setSuccessSubscriptionModalOpen}
				onClose={() => setSuccessSubscriptionModalOpen(false)}
				width={300}
				height={"auto"}
				style={s.modal}
			>
				<Box
					style={s.container}
					width={"100%"}
					align='center'
				>
					<Box
						style={s.wrapper}
						fD="column"
						gap={20}
						width={"100%"}
						align='center'
					>
						<MainText
							px={TEXT_SIZE}
							tac="center"
						>
							{t("greetings")}
						</MainText>

						<Box
							centered
							width={"100%"}
						>
							<PremiumIconUi
								isPremium={true}
								size={150}
								isStatic
							/>
						</Box>

						<MainText
							px={TEXT_SIZE}
							tac="center"
						>
							{t("success_subscription_greetings").split(" ").map((word, index, array) => {
								if (word === "Premium") {
									return (
										<MainText
											key={index}
											primary
											px={TEXT_SIZE}
										>
											{`${word} `}
										</MainText>
									);
								}
								return word + (index < array.length - 1 ? " " : "");
							})}
						</MainText>
					</Box>

					<ConfetiAnimation
						style={s.confeti}
						size={300}
					/>
				</Box>
			</CustomModalUi>
		</Portal>
	);
});

const s = StyleSheet.create({
	wrapper: {
		zIndex: 1001
	},
	container: {
		position: 'relative',
		overflow: 'hidden',
		paddingVertical: 30,
		paddingHorizontal: 20,
	},
	confeti: {
		position: 'absolute',
		top: 40,
		left: 0,
		zIndex: 999,
		transform: [{ scale: 1.4 }]
	},
	modal: {
		paddingVertical: 0,
		paddingHorizontal: 0,
		zIndex: 1000
	}
});
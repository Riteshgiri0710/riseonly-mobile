import diamondJson from "@animations/diamond.json";
import { Box, ContextMenuUi, SimpleButtonUi } from '@core/ui';
import LottieView from 'lottie-react-native';
import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { getPremiumContextMenuItems } from 'src/modules/user/shared/config/context-menu-data';
import { Profile, profileStore } from 'src/modules/user/stores/profile';

export const PremiumIconUi = observer(({
	size = 20,
	profileToShow,
	isPremium = false,
	isStatic = false,
	style = {}
}: PremiumIconUiProps) => {
	const { profile } = profileStore;

	const [premiumContextMenuOpen, setPremiumContextMenuOpen] = useState(false);
	const premBtnRef = useRef(null);

	const onPremiumIconPress = () => {
		if (!profile) {
			console.warn("[onPremiumIconPress]: User doesn't exists");
			return;
		}

		// TODO: Раскомментировать при проде, а все строчки кода ниже наоборот удалить
		// if (profile.isPremium) {
		// 	setPremiumContextMenuOpen(true)
		// 	return
		// }

		// setPremiumModalOpen(true)

		setPremiumContextMenuOpen(true);
	};

	// TODO: Убрать при проде
	// if (!isPremium) {
	// 	return null
	// }

	const s = {
		width: size,
		height: size
	};

	if (isStatic) return (
		<Box
			style={[
				s,
				style
			]}
		>
			<LottieView
				source={diamondJson}
				autoPlay
				loop
				speed={0.5}
				style={{ width: size, height: size }}
			/>
		</Box>
	);

	return (
		<>
			<SimpleButtonUi
				style={[
					s,
					style
				]}
				onPress={onPremiumIconPress}
				ref={premBtnRef}
			>
				<LottieView
					source={diamondJson}
					autoPlay
					loop
					speed={0.5}
					style={{ width: size, height: size }}
				/>
			</SimpleButtonUi>

			<ContextMenuUi
				items={getPremiumContextMenuItems(setPremiumContextMenuOpen, profileToShow || profile!)}
				isVisible={premiumContextMenuOpen}
				onClose={() => setPremiumContextMenuOpen(false)}
				anchorRef={premBtnRef}
				offset={{ x: 0, y: 5 }}
			/>
		</>
	);
});

interface PremiumIconUiProps {
	profileToShow?: Profile;
	size?: number;
	isPremium: boolean;
	isStatic?: boolean;
	style?: StyleProp<ViewStyle>;
}
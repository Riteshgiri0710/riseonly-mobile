import { overlayColor } from '@core/config/const';
import { ModalData } from '@core/config/types';
import { MainText, SimpleButtonUi } from '@core/ui';
import React, { JSX, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { themeStore } from 'src/modules/theme/stores';

interface ModalUiProps {
	visible: boolean;
	animationDuration?: number;
	width?: number | string;
	instaOpen?: boolean;
	title?: string;
	onClose: () => void;
	children: JSX.Element;
}

export const ModalUi = ({
	visible,
	animationDuration = 300,
	width = 300,
	instaOpen = false,
	onClose,
	title,
	children,
}: ModalUiProps): React.ReactElement | null => {
	const { currentTheme } = themeStore;
	const { t } = useTranslation();

	const scaleAnim = useRef(new Animated.Value(0.8)).current;
	const opacityAnim = useRef(new Animated.Value(0)).current;
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		if (visible && !mounted) setMounted(true);
		if (visible) {
			Animated.parallel([
				Animated.timing(scaleAnim, {
					toValue: 1,
					duration: animationDuration,
					useNativeDriver: true,
				}),
				Animated.timing(opacityAnim, {
					toValue: 1,
					duration: animationDuration * 0.8,
					useNativeDriver: true,
				}),
			]).start();
		} else if (mounted) {
			Animated.parallel([
				Animated.timing(scaleAnim, {
					toValue: 0.85,
					duration: animationDuration / 2,
					useNativeDriver: true,
				}),
				Animated.timing(opacityAnim, {
					toValue: 0,
					duration: animationDuration / 2,
					useNativeDriver: true,
				}),
			]).start(() => {
				setMounted(false);
				scaleAnim.setValue(0.8);
			});
		}
	}, [visible, animationDuration, scaleAnim, opacityAnim, mounted]);

	if (!mounted) return null;

	return (
		<Portal>
			<View style={StyleSheet.absoluteFill}>
				<Animated.View
					style={[
						StyleSheet.absoluteFill,
						styles.overlay,
						{
							opacity: (instaOpen && visible) ? 1 : opacityAnim,
							backgroundColor: overlayColor,
						}
					]}
				>
					<TouchableWithoutFeedback onPress={onClose}>
						<View style={styles.overlayTouch}>
							<TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
								<Animated.View
									style={[
										styles.modalContainer,
										{
											backgroundColor: currentTheme.bg_200,
											opacity: opacityAnim,
											transform: [{ scale: scaleAnim }],
											width,
										},
									]}
								>
									{title && (
										<MainText
											tac='center'
											fontWeight='bold'
											px={17}
										>
											{title}
										</MainText>
									)}

									{children}

									{/* <View style={styles.buttonsContainer}>
										<SimpleButtonUi
											style={[
												styles.button,
												{ backgroundColor: currentTheme.btn_bg_300, },
												modalData.buttonStyle
											]}
											onPress={onClose}
										>
											<MainText
												width={"100%"}
												tac='center'
												px={14}
											>
												{t('cancel_text')}
											</MainText>
										</SimpleButtonUi>

										<SimpleButtonUi
											style={[
												styles.button,
												{
													backgroundColor: currentTheme.primary_100,
												},
												modalData.buttonStyle
											]}
											onPress={modalData.onPress}
										>
											<MainText
												width={"100%"}
												tac='center'
												px={14}
											>
												{modalData.buttonText || ''}
											</MainText>
										</SimpleButtonUi>
									</View> */}
								</Animated.View>
							</TouchableWithoutFeedback>
						</View>
					</TouchableWithoutFeedback>
				</Animated.View>
			</View>
		</Portal>
	);
};

const styles = StyleSheet.create({
	button: {
		borderRadius: 5,
		flex: 1,
		alignItems: 'center',
		paddingVertical: 8,
		justifyContent: 'center',
	},
	modalContainer: {
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 15,
		paddingHorizontal: 15,
		borderRadius: 10,
		elevation: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	buttonsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 10,
		width: '100%',
	},
	overlay: {
		margin: 0,
		padding: 0,
	},
	overlayTouch: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	defaultContent: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	defaultText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
});
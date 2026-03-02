import { DownloadIcon } from '@icons/MainPage/Posts/DownloadIcon';
import { ArrowRightIcon } from '@icons/Ui/ArrowRightIcon';
import { BackArrowLeftIcon } from '@icons/Ui/BackArrowLeftIcon';
import { CloseIcon } from '@icons/Ui/CloseIcon';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Swiper from 'react-native-swiper';
import { ButtonUi } from '../ButtonUi/ButtonUi';
import { GetWho } from '../GetWho/GetWho';
import { LiveTimeAgo } from '../LiveTimeAgo';
import { MainText } from '../MainText/MainText';
import { UserLogo } from '../UserLogo/UserLogo';
import { styles } from './styles';

export const ImageViewerUi = observer(({
	open,
	onClose,
	currentImage,
	imagesArr,
	totalCount,
	which,
	limit = 0
}: NicsImageViewerProps) => {
	const [activeIndex, setActiveIndex] = useState(
		[...imagesArr].findIndex(img => img.id === currentImage.id) || 0
	);

	const imagesRef = useRef(imagesArr);
	const mainSwiperRef = useRef(null);
	const thumbSwiperRef = useRef(null);
	const insets = useSafeAreaInsets();

	const opacity = useSharedValue(0);
	const touchStartY = useRef<number | null>(null);
	const touchStartTime = useRef<number | null>(null);

	useEffect(() => {
		if (open) {
			opacity.value = withTiming(1, { duration: 300 });
		} else {
			opacity.value = withTiming(0, { duration: 300 });
		}
	}, [open]);

	useEffect(() => {
		imagesRef.current = imagesArr;
	}, [imagesArr]);

	const handleTouchStart = (e: any) => {
		touchStartY.current = e.nativeEvent.pageY;
		touchStartTime.current = Date.now();
	};

	const handleTouchMove = (e: any) => {
		if (!touchStartY.current || !touchStartTime.current) return;

		const y = e.nativeEvent.pageY;
		const diffY = y - touchStartY.current;
		const timeElapsed = Date.now() - touchStartTime.current;
		const speed = Math.abs(diffY / timeElapsed);

		if (speed > 0.5 && Math.abs(diffY) > 100) {
			onClose();
		}
	};

	const handleDownload = (url: string) => {
		console.log('Download image:', url);
	};

	const handleImageChange = (index: number) => {
		setActiveIndex(index);
		if (mainSwiperRef.current) {
			// @ts-ignore
			mainSwiperRef.current?.scrollTo(index);
		}
		if (thumbSwiperRef.current) {
			// @ts-ignore
			thumbSwiperRef.current?.scrollTo(index);
		}
	};

	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: opacity.value,
		};
	});

	if (!open) return null;

	return (
		<Animated.View style={[styles.main, animatedStyle]}>
			<TouchableWithoutFeedback
				onPressIn={handleTouchStart}
				onPressOut={handleTouchMove}
			>
				<View style={styles.imageContainer}>
					<View style={[styles.top, { paddingTop: insets.top + 10 }]}>
						<View style={styles.topleft}>
							<UserLogo size={60} source={""} />
							<View style={styles.names}>
								<MainText>bro</MainText>
								<GetWho who={""} />
							</View>

							<View style={styles.left}>
								<LiveTimeAgo date={""} />
							</View>
						</View>

						<View style={styles.topmid}>
							<MainText>
								{imagesArr[activeIndex]?.imageCount} из {totalCount}
							</MainText>
						</View>

						<View style={styles.topright}>
							<View style={styles.right}>
								<ButtonUi onPress={onClose}>
									<CloseIcon color='white' size={25} />
								</ButtonUi>
							</View>
						</View>
					</View>

					<View style={styles.mid}>
						<TouchableOpacity
							style={styles.arrowButton}
							onPress={() => activeIndex > 0 && handleImageChange(activeIndex - 1)}
						>
							<BackArrowLeftIcon color='white' />
						</TouchableOpacity>

						<Swiper
							ref={mainSwiperRef}
							style={styles.swiper}
							showsPagination={false}
							loop={false}
							index={activeIndex}
							onIndexChanged={handleImageChange}
						>
							{imagesRef.current?.map((img) => {
								const screenHeight = Dimensions.get('window').height;
								const screenWidth = Dimensions.get('window').width;

								return (
									<View key={img.id} style={styles.swipeSlide}>
										<FastImage
											source={{ uri: img.url }}
											style={{
												maxWidth: '100%',
												maxHeight: screenHeight * 0.6,
											}}
											resizeMode={FastImage.resizeMode.contain}
										/>
									</View>
								);
							})}
						</Swiper>

						<TouchableOpacity
							style={styles.arrowButton}
							onPress={() => activeIndex < imagesArr.length - 1 && handleImageChange(activeIndex + 1)}
						>
							<ArrowRightIcon color='white' />
						</TouchableOpacity>
					</View>

					<View style={[styles.bot, { paddingBottom: insets.bottom + 10 }]}>
						<View style={styles.bottop}>
							<MainText px={17} style={styles.content}>
								bro
							</MainText>
						</View>

						<View style={styles.botbot}>
							<View style={styles.botcontainer}>
								<Swiper
									ref={thumbSwiperRef}
									style={styles.thumbSwiper}
									showsPagination={false}
									loop={false}
									index={activeIndex}
									onIndexChanged={handleImageChange}
									horizontal
								>
									{imagesRef.current?.map((img, index) => (
										<TouchableOpacity
											key={img.id}
											onPress={() => handleImageChange(index)}
											style={styles.swipeSlide}
										>
											<View style={[styles.botimg, index === activeIndex && styles.active]}>
												<FastImage
													source={{ uri: img.url }}
													style={styles.thumbImage}
													resizeMode={FastImage.resizeMode.cover}
												/>
											</View>
										</TouchableOpacity>
									))}
								</Swiper>
							</View>

							<View style={styles.botright}>
								<View style={styles.btns}>
									<ButtonUi
										style={styles.btn}
										onPress={() => handleDownload(imagesArr[activeIndex].url)}
									>
										<DownloadIcon size={25} />
									</ButtonUi>
								</View>
							</View>
						</View>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</Animated.View>
	);
});

export interface ImageData {
	id?: string;
	url: string;
	width?: number;
	height?: number;
	createdAt?: string;
	messageId?: string;
	imageCount?: number;
}

interface NicsImageViewerProps {
	open: boolean;
	onClose: () => void;
	currentImage: ImageData;
	imagesArr: ImageData[];
	totalCount?: number;
	which?: "message" | null | "profile";
	limit?: number;
}


import { getPostTags, getReactivePreviewPost } from '@config/ts';
import type { MediaItem, MediaPickerRef } from '@core/ui';
import { Box, ButtonUi, CleverImage, InputUi, MainText, MediaPickerUi, SimpleButtonUi, SimpleTextAreaUi, SwitchUi } from '@core/ui';
import { CommentSettingIcon } from '@icons/Ui/CommentSettingIcon';
import { FileIcon } from '@icons/Ui/FileIcon';
import previewImg from "@images/postImagePreview.png";
import { useFocusEffect, useNavigation } from '@lib/navigation';
import { numericId } from '@lib/numbers';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Post } from 'src/modules/post/components';
import { postActionsStore, postInteractionsStore } from 'src/modules/post/stores';
import { themeStore } from 'src/modules/theme/stores';
import { GridPosts } from 'src/modules/user/components/ProfileContent/pages';
import { profileStore } from 'src/modules/user/stores/profile';

const PADDING_HORIZONTAL = 7;

export const CreatePost = observer(() => {
	const { currentTheme, safeAreaWithContentHeight: { safeAreaWithContentHeight } } = themeStore;
	const { profile } = profileStore;
	const {
		createPost: {
			isPending
		}
	} = postActionsStore;
	const {
		createPostForm: {
			values,
			errors,
			setValue
		},
		inpHashtags: { inpHashtags, setInpHashtags },
		selectedMedias: { selectedMedias, setSelectedMedias },
		createPostHandler,
		onHashtagInput,
		toggleTag
	} = postInteractionsStore;

	if (!profile) return <></>;

	const { width } = useWindowDimensions();
	const { t } = useTranslation();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const mediaRef = useRef<MediaPickerRef>(null);
	const [mediaOpen, setMediaOpen] = useState(false);

	const onFileClick = useCallback(() => setMediaOpen(true), []);

	const onCreatePost = useCallback(() => {
		createPostHandler();
		navigation.goBack();
	}, [createPostHandler, navigation]);

	const onMediaFinish = useCallback((medias: MediaItem[]) => {
		setSelectedMedias(medias);
		const imagesArr = medias.map((t) => t.uri);
		setValue("images", imagesArr as never[]);
	}, [setSelectedMedias, setValue]);

	useFocusEffect(
		useCallback(() => {
			return () => {
				if (mediaRef.current) mediaRef.current.resetStates();
			};
		}, [])
	);

	return (
		<>
			<ProfileSettingsWrapper
				tKey='create_post_text'
				wrapperStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
				needScrollView={false}
				requiredBg={false}
			>
				<Box
					flex={1}
					height={"100%"}
					width={"100%"}
				>
					<ScrollView
						style={s.scrollView}
					>
						<Box
							flex={1}
							height={"100%"}
							width={"100%"}
							gap={15}
							bgColor={currentTheme.bg_200}
							style={{ paddingVertical: (safeAreaWithContentHeight / 2) + 10, paddingHorizontal: PADDING_HORIZONTAL }}
						>
							<Box
								style={[
									s.previewContainer,
									{ borderColor: currentTheme.border_100, }
								]}>
								<Box style={s.previewBg}>
									<CleverImage
										source={previewImg}
										intensity={10}
										wrapperStyles={{ borderRadius: 20 }}
									/>
								</Box>

								<Box
									style={s.textTop}
									fD='row'
								>
									<Box style={s.topLeftText}>
										<MainText
											fontWeight='700'
											px={12}
										>
											{t("post_preview_in_profile")}
										</MainText>
									</Box>

									<Box style={s.topRightText}>
										<MainText
											fontWeight='700'
											px={12}
										>
											{t("post_preview_in_list")}
										</MainText>
									</Box>
								</Box>

								<Box style={{ paddingBottom: 20 }}>
									<Box
										style={s.previewContent}
										fD='row'
										align='center'
										gap={10}
									>
										<SimpleButtonUi
											style={s.previewLeft}
										>
											<Box
												width={"100%"}
												centered
												flex={1}
											>
												<GridPosts
													max={9}
													currentElement={[{ title: values.title || t("preview_post_title"), content: "", id: numericId(), images: values.images }]}
													fetchIfHaveData={false}
													postContainerStyle={{ width: "33.333%", height: 50 }}
													pageContainerStyle={{ alignItems: "center" }}
													mainContainerStyle={{ alignItems: "center", justifyContent: "center" }}
													isPreview
												/>
											</Box>
										</SimpleButtonUi>

										<ScrollView
											showsHorizontalScrollIndicator={false}
											showsVerticalScrollIndicator={false}
										>
											<SimpleButtonUi
												style={s.previewRight}
											>
												<Post
													post={getReactivePreviewPost(values, inpHashtags)}
													imageWidth={((width - (PADDING_HORIZONTAL * 2 + 2)) / 2) - PADDING_HORIZONTAL - 11}
													isPreview
												/>
											</SimpleButtonUi>
										</ScrollView>

										<SimpleButtonUi
											onPress={onFileClick}
											style={s.fileBtn}
										>
											<FileIcon
												color={currentTheme.text_100}
												size={20}
											/>
										</SimpleButtonUi>
									</Box>
								</Box>
							</Box>

							<Box
								style={s.postOptions}
								gap={15}
							>
								<ScrollView
									showsHorizontalScrollIndicator={false}
								>
									<Box
										gap={3}
										fD='row'
									>
										{getPostTags().map((t, i) => {
											return (
												<SimpleButtonUi
													key={i}
													bgColor={values.tags.includes(t as never) ?
														currentTheme.primary_300
														: currentTheme.btn_bg_200
													}
													onPress={() => toggleTag(t)}
													style={[
														s.tagBtn,
														{ borderColor: currentTheme.border_100, }
													]}
												>
													<MainText
														key={i}
														px={14}
														fontWeight='600'
													>
														{t}
													</MainText>
												</SimpleButtonUi>
											);
										})}
									</Box>
								</ScrollView>

								<Box width={"100%"}>
									<InputUi
										value={values.title}
										name={"title"}
										setValue={setValue}
										placeholder={t("create_post_title_placeholder")}
										style={{ width: "100%", height: 40, fontSize: 14 }}
										maxLength={100}
										errors={errors}
									/>
								</Box>

								<SimpleTextAreaUi
									values={values}
									name='content'
									onChange={(e) => setValue("content", e.nativeEvent.text)}
									containerStyle={[
										s.textArea,
										{
											backgroundColor: currentTheme.btn_bg_300,
											borderColor: currentTheme.input_border_300,
										}
									]}
									inputStyle={{ minHeight: 200 }}
									style={{ fontSize: 14 }}
									placeholder={t("create_post_content_placeholder")}
									maxLength={10000}
									setText={(text) => setValue("content", text)}
								/>

								<Box
									width={"100%"}
								>
									<InputUi
										value={inpHashtags}
										name={"hashtags"}
										onChange={e => {
											const text = e.nativeEvent.text;
											onHashtagInput(text);
										}}
										placeholder={t("create_post_hashtags_placeholder")}
										style={{ width: "100%", height: 40, fontSize: 14 }}
										maxLength={100}
										errors={errors}
									/>
								</Box>

								<Box>
									<View
										style={[
											s.groupContainer,
											{
												backgroundColor: currentTheme.btn_bg_300,
												borderColor: currentTheme.input_border_300,
												borderWidth: 1
											},
										]}
									>
										<SimpleButtonUi
											style={s.btn}
											onPress={() => setValue("canComment", !values.canComment)}
										>
											<View
												style={[
													s.btnLeft,
													{
														alignItems: "center",
														justifyContent: "center",
														height: "100%",
													}
												]}
											>
												<CommentSettingIcon size={22} />
											</View>

											<View
												style={[
													s.btnRight,
													{
														paddingLeft: 0,
														minHeight: 42.5,
														paddingVertical: 5
													},
												]}
											>
												<Box
													flex={0}
												>
													<Box
														centered
														flex={1}
													>
														<MainText
															numberOfLines={1}
															mR={5}
														>
															{t("create_post_can_comment")}
														</MainText>
													</Box>
												</Box>

												<Box
													fD='row'
													flex={1}
													align='center'
													gap={10}
													justify="flex-end"
												>
													<SwitchUi
														isOpen={!values.canComment}
														onPress={() => setValue("canComment", !values.canComment)}
													/>
												</Box>
											</View>
										</SimpleButtonUi>
									</View>
								</Box>
							</Box>
						</Box>
					</ScrollView>

					{/* BOTTOM BAR */}
					<Box
						style={[
							s.bottomBar,
							{
								borderTopColor: currentTheme.border_100,
								paddingBottom: insets.bottom + 5,
							}
						]}
					>
						<ButtonUi
							style={s.createPostBtn}
							onPress={onCreatePost}
							isPending={isPending}
							disabled={isPending}
						>
							<MainText
								tac='center'
								fontWeight="600"
							>
								{t("create_post_btn_text")}
							</MainText>
						</ButtonUi>
					</Box>
				</Box>
			</ProfileSettingsWrapper>

			{mediaOpen && (
				<MediaPickerUi
					isVisible={mediaOpen}
					onClose={() => setMediaOpen(false)}
					onFinish={onMediaFinish}
					selectedMedias={selectedMedias}
					maxSelections={10}
					needAutoReset={false}
					ref={mediaRef}
					includeEditing
					multiple
				/>
			)}
		</>
	);
});

const s = StyleSheet.create({
	bottomBar: {
		width: "100%",
		borderWidth: 1,
		paddingTop: 12.5,
		paddingHorizontal: PADDING_HORIZONTAL,
	},
	previewContainer: {
		height: 250,
		width: "100%",
		borderWidth: 1,
		overflow: "hidden",
		borderRadius: 20,
	},
	previewLeft: {
		width: "50%",
		height: "100%",
		alignContent: "center",
	},
	previewRight: {
		height: "100%",
		alignContent: "center",
	},
	textArea: {
		width: "100%",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderWidth: 0.5,
		borderRadius: 10,
	},
	textTop: {
		paddingVertical: 5
	},
	tagBtn: {
		paddingVertical: 5,
		paddingHorizontal: 15,
		borderWidth: 0.5,
		borderRadius: 10
	},
	fileBtn: {
		position: "absolute",
		bottom: 20,
		left: PADDING_HORIZONTAL * 2,
	},
	topLeftText: {
		alignItems: "center",
		justifyContent: "center",
		width: "50%",
	},
	topRightText: {
		alignItems: "center",
		justifyContent: "center",
		width: "50%",
	},
	scrollView: {
		width: "100%"
	},
	postOptions: {
		width: "100%",
	},
	createPostBtn: {
		height: 40,
		borderRadius: 10
	},
	previewBg: {
		height: "100%",
		width: "100%",
		zIndex: -1,
		position: "absolute"
	},
	previewContent: {
		zIndex: 1,
		height: "100%",
		width: "100%",
		paddingHorizontal: 10,
	},
	groupContainer: {
		borderRadius: 10,
		overflow: "hidden",
		flexDirection: 'column',
		paddingRight: 12.5,
	},
	btnRight: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: "100%",
		flex: 1
	},
	btnLeft: {
		flexDirection: "row",
		gap: 8,
		width: 50,
		alignItems: "center",
	},
	btn: {
		flexDirection: 'row',
		justifyContent: "space-between",
		alignItems: "center",
		width: "100%",
	},
});
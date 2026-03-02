import { getPreviewPost } from '@core/config/ts';
import { Box, CleverImage, SimpleButtonUi } from '@core/ui';
import defaultPreviewImg from "@images/postImagePreview.png";
import { observer } from 'mobx-react-lite';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DimensionValue, ScrollView, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { Post } from 'src/modules/post/components';
import { themeStore } from 'src/modules/theme/stores';
import { profileStore } from 'src/modules/user/stores/profile';

interface PreviewBgUiProps {
	previewImg?: string;
	previewText?: string;
	paddingHorizontal?: number;
	outerPaddingHorizontal?: number;
	previewContentStyle?: ViewStyle;
	previewContainerStyle?: ViewStyle;
	previewHeight?: DimensionValue;
	scrollEnabled?: boolean;
	children?: ReactNode;
}

export const PreviewBgUi = observer(({
	previewImg,
	previewText = "",
	paddingHorizontal = 30,
	previewContentStyle = {},
	outerPaddingHorizontal = 0,
	previewContainerStyle = {},
	previewHeight = 250,
	scrollEnabled = true,
	children,
}: PreviewBgUiProps) => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;

	const { t } = useTranslation();
	const { width } = useWindowDimensions();

	if (!profile) return <></>;

	return (
		<Box
			style={[
				{
					height: previewHeight,
					borderColor: currentTheme.border_100,
				},
				s.previewContainer,
				previewContainerStyle,
			]}>
			<Box style={s.previewBg}>
				<CleverImage
					source={previewImg ? previewImg : defaultPreviewImg}
					intensity={10}
					wrapperStyles={{ borderRadius: 20 }}
				/>
			</Box>

			<Box>
				<Box
					style={[
						{ paddingHorizontal },
						s.previewContent,
						previewContentStyle,
					]}
					fD='row'
					align='center'
					gap={10}
				>
					<ScrollView
						showsHorizontalScrollIndicator={false}
						showsVerticalScrollIndicator={false}
						scrollEnabled={scrollEnabled}
					>
						{children || (
							<SimpleButtonUi
								style={s.previewRight}
							>
								<Post
									post={getPreviewPost(previewText, t)}
									imageWidth={width - (paddingHorizontal * 2) - (outerPaddingHorizontal * 2)}
									isPreview
								/>
							</SimpleButtonUi>
						)}
					</ScrollView>
				</Box>
			</Box>
		</Box>
	);
});

const s = StyleSheet.create({
	previewContainer: {
		width: "100%",
		borderWidth: 1,
		overflow: "hidden",
		borderRadius: 20,
	},
	previewRight: {
		height: "100%",
		alignContent: "center",
	},
	textTop: {
		paddingVertical: 5
	},
	previewContent: {
		zIndex: 1,
		height: "100%",
		width: "100%",
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
	previewBg: {
		height: "100%",
		width: "100%",
		zIndex: -1,
		position: "absolute"
	},
});
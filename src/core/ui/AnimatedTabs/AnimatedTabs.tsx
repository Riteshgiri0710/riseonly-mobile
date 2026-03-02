import { getIconColor as getIconColorDefault } from '@core/config/const';
import { BlurUi, MainText } from '@core/ui';
import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	DimensionValue,
	Platform,
	Animated as ReactNativeAnimated,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
	useWindowDimensions
} from 'react-native';
import Animated, {
	SharedValue,
	runOnJS,
	useAnimatedReaction,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
	withTiming
} from 'react-native-reanimated';
import { themeStore } from 'src/modules/theme/stores';

const ActiveTabContext = React.createContext<number>(0);
const UseParentScrollContext = React.createContext<boolean>(false);

const TabItem = React.memo(({
	tab,
	tabIndex,
	isActive,
	iconColor,
	iconSize,
	tabStyle,
	activeTabStyle,
	simple,
	currentThemeText,
	onPress,
	onTabLayout,
	onTextLayout,
	setTabRef
}: {
	tab: TabConfig;
	tabIndex: number;
	isActive: boolean;
	iconColor: string;
	iconSize: number;
	tabStyle: ViewStyle;
	activeTabStyle?: ViewStyle;
	simple: boolean;
	currentThemeText: string;
	onPress: () => void;
	onTabLayout: (event: any) => void;
	onTextLayout: (event: any) => void;
	setTabRef: (ref: View | null) => void;
}) => {
	return (
		<TouchableOpacity
			ref={setTabRef}
			style={[
				styles.tab,
				tabStyle,
				isActive && [styles.activeTab, activeTabStyle]
			]}
			onPress={onPress}
			onLayout={onTabLayout}
		>
			{tab.icon && iconColor ? (() => {
				const IconComponent = tab.icon;
				return <IconComponent size={iconSize} color={iconColor} />;
			})() : null}

			{tab.text ? (
				<MainText
					numberOfLines={1}
					color={iconColor || currentThemeText}
					onLayout={onTextLayout}
				>
					{String(tab.text)}
				</MainText>
			) : null}
		</TouchableOpacity>
	);
}, (prevProps, nextProps) => {
	return (
		prevProps.isActive === nextProps.isActive &&
		prevProps.iconColor === nextProps.iconColor &&
		prevProps.tab === nextProps.tab &&
		prevProps.iconSize === nextProps.iconSize &&
		prevProps.simple === nextProps.simple
	);
});

const TabsContainer = React.memo(({
	tabs,
	activeTab,
	iconColors,
	iconSize,
	tabStyle,
	activeTabStyle,
	simple,
	currentThemeText,
	tabsScrollViewRef,
	tabRefs,
	tabLayouts,
	tabLayoutsShared,
	tabCount,
	handleTabPress,
	updateIndicator,
	scrollX,
	width,
	scrollViewWidth,
	indicatorStyle,
	currentThemePrimary
}: {
	tabs: TabConfig[];
	activeTab: number;
	iconColors: string[];
	iconSize: number;
	tabStyle: ViewStyle;
	activeTabStyle?: ViewStyle;
	simple: boolean;
	currentThemeText: string;
	tabsScrollViewRef: React.RefObject<ScrollView | null>;
	tabRefs: React.MutableRefObject<(View | null)[]>;
	tabLayouts: React.MutableRefObject<{ x: number; width: number; textX: number; textWidth: number; }[]>;
	tabLayoutsShared: any;
	tabCount: number;
	handleTabPress: (index: number) => void;
	updateIndicator: (index: number) => void;
	scrollX: any;
	width: number;
	scrollViewWidth: number;
	indicatorStyle?: ViewStyle;
	currentThemePrimary: string;
}) => {
	const layoutHandlersRef = useRef<Map<number, (event: any) => void>>(new Map());
	const textLayoutHandlersRef = useRef<Map<number, (event: any) => void>>(new Map());
	const tabRefSettersRef = useRef<Map<number, (ref: View | null) => void>>(new Map());
	const tabPressHandlersRef = useRef<Map<number, () => void>>(new Map());

	useEffect(() => {
		if (layoutHandlersRef.current.size > tabCount) {
			for (let i = tabCount; i < layoutHandlersRef.current.size; i++) {
				layoutHandlersRef.current.delete(i);
				textLayoutHandlersRef.current.delete(i);
				tabRefSettersRef.current.delete(i);
				tabPressHandlersRef.current.delete(i);
			}
		}
		return () => {
			if (layoutUpdateTimeoutRef.current !== null) {
				cancelAnimationFrame(layoutUpdateTimeoutRef.current);
			}
		};
	}, [tabCount]);

	const layoutUpdateTimeoutRef = useRef<number | null>(null);

	const getTabLayoutHandler = useCallback((tabIndex: number) => {
		if (!layoutHandlersRef.current.has(tabIndex)) {
			layoutHandlersRef.current.set(tabIndex, (event: any) => {
				const { x, width: tabWidth } = event.nativeEvent.layout;
				if (isNaN(x) || isNaN(tabWidth)) return;

				if (tabIndex >= tabLayouts.current.length) {
					while (tabLayouts.current.length <= tabIndex) {
						tabLayouts.current.push({ x: 0, width: 0, textX: 0, textWidth: 0 });
					}
				}

				const existingLayout = tabLayouts.current[tabIndex] || { x: 0, width: 0, textX: 0, textWidth: 0 };
				tabLayouts.current[tabIndex] = {
					...existingLayout,
					x,
					width: tabWidth
				};

				if (layoutUpdateTimeoutRef.current !== null) {
					cancelAnimationFrame(layoutUpdateTimeoutRef.current);
				}

				layoutUpdateTimeoutRef.current = requestAnimationFrame(() => {
					const layouts = tabLayouts.current;
					let allValid = true;
					for (let i = 0; i < tabCount; i++) {
						const layout = layouts[i];
						if (!layout || isNaN(layout.x) || isNaN(layout.width)) {
							allValid = false;
							break;
						}
					}
					if (allValid) {
						tabLayoutsShared.value = layouts.slice();
					}
				});
			});
		}
		return layoutHandlersRef.current.get(tabIndex)!;
	}, [tabLayouts, tabLayoutsShared, tabCount]);

	const getTextLayoutHandler = useCallback((tabIndex: number) => {
		if (!textLayoutHandlersRef.current.has(tabIndex)) {
			textLayoutHandlersRef.current.set(tabIndex, (e: any) => {
				if (simple) return;

				const { x, width: textWidth } = e.nativeEvent.layout;
				if (isNaN(x) || isNaN(textWidth)) return;

				if (tabIndex >= tabLayouts.current.length) {
					while (tabLayouts.current.length <= tabIndex) {
						tabLayouts.current.push({ x: 0, width: 0, textX: 0, textWidth: 0 });
					}
				}

				const existingLayout = tabLayouts.current[tabIndex] || { x: 0, width: 0, textX: 0, textWidth: 0 };
				tabLayouts.current[tabIndex] = {
					...existingLayout,
					textX: x,
					textWidth
				};

				if (layoutUpdateTimeoutRef.current !== null) {
					cancelAnimationFrame(layoutUpdateTimeoutRef.current);
				}

				layoutUpdateTimeoutRef.current = requestAnimationFrame(() => {
					const layouts = tabLayouts.current;
					let allValid = true;
					for (let i = 0; i < tabCount; i++) {
						const layout = layouts[i];
						if (!layout || isNaN(layout.x) || isNaN(layout.width)) {
							allValid = false;
							break;
						}
					}
					if (allValid) {
						tabLayoutsShared.value = layouts.slice();
					}
				});
			});
		}
		return textLayoutHandlersRef.current.get(tabIndex)!;
	}, [simple, tabLayouts, tabLayoutsShared, tabCount]);

	const getTabRefSetter = useCallback((tabIndex: number) => {
		if (!tabRefSettersRef.current.has(tabIndex)) {
			tabRefSettersRef.current.set(tabIndex, (ref: View | null) => {
				tabRefs.current[tabIndex] = ref;
			});
		}
		return tabRefSettersRef.current.get(tabIndex)!;
	}, [tabRefs]);

	const getTabPressHandler = useCallback((tabIndex: number) => {
		if (!tabPressHandlersRef.current.has(tabIndex)) {
			tabPressHandlersRef.current.set(tabIndex, () => handleTabPress(tabIndex));
		}
		return tabPressHandlersRef.current.get(tabIndex)!;
	}, [handleTabPress]);

	const defaultTabWidth = scrollViewWidth / tabCount;
	const indicatorPosition = useSharedValue(0);
	const indicatorWidth = useSharedValue(defaultTabWidth);

	useEffect(() => {
		const layouts = tabLayouts.current;
		if (!layouts || activeTab < 0 || activeTab >= layouts.length) return;
		const layout = layouts[activeTab];
		if (!layout || typeof layout.x !== 'number' || typeof layout.textX !== 'number' || typeof layout.textWidth !== 'number') return;
		const pos = layout.x + layout.textX;
		const w = layout.textWidth;
		if (pos > 0 && w > 0) {
			indicatorPosition.value = withTiming(pos, { duration: 150 });
			indicatorWidth.value = withTiming(w, { duration: 150 });
		}
	}, [activeTab, indicatorPosition, indicatorWidth]);


	const simpleIndicatorPosition = useSharedValue(0);
	const lastSimpleScroll = useSharedValue(0);

	useAnimatedReaction(
		() => simple ? scrollX.value : 0,
		(scrollValue) => {
			'worklet';
			if (!simple) return;
			const diff = Math.abs(scrollValue - lastSimpleScroll.value);
			if (diff > 30) {
				const tabWidth = scrollViewWidth / tabCount;
				simpleIndicatorPosition.value = (scrollValue / scrollViewWidth) * tabWidth;
				lastSimpleScroll.value = scrollValue;
			}
		},
		[simple, scrollViewWidth, tabCount]
	);

	const indicatorAnimatedStyle = useAnimatedStyle(() => {
		'worklet';
		if (simple) {
			const tabWidth = scrollViewWidth / tabCount;
			return {
				width: tabWidth,
				transform: [{ translateX: simpleIndicatorPosition.value }]
			};
		}

		return {
			width: indicatorWidth.value,
			transform: [{ translateX: indicatorPosition.value }]
		};
	}, [simple, scrollViewWidth, tabCount]);

	const tabItems = useMemo(() => tabs.map((tab, tabIndex) => (
		<TabItem
			key={tabIndex}
			tab={tab}
			tabIndex={tabIndex}
			isActive={activeTab === tabIndex}
			iconColor={iconColors[tabIndex]}
			iconSize={iconSize}
			tabStyle={tabStyle}
			activeTabStyle={activeTabStyle}
			simple={simple}
			currentThemeText={currentThemeText}
			onPress={getTabPressHandler(tabIndex)}
			onTabLayout={getTabLayoutHandler(tabIndex)}
			onTextLayout={getTextLayoutHandler(tabIndex)}
			setTabRef={getTabRefSetter(tabIndex)}
		/>
	)), [tabs, activeTab, iconColors, iconSize, tabStyle, activeTabStyle, simple, currentThemeText]);

	return (
		<Animated.ScrollView
			ref={tabsScrollViewRef as any}
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={{ minWidth: '100%' }}
			style={{ backgroundColor: "transparent" }}
			pointerEvents='box-none'
			bounces={false}
		>
			<View
				style={{
					position: 'relative',
					width: '100%'
				}}
				pointerEvents='box-none'
			>
				<View
					style={{
						flexDirection: 'row',
						width: '100%',
						justifyContent: 'space-evenly'
					}}
					pointerEvents='box-none'
				>
					{tabItems}
				</View>

				<Animated.View
					style={[
						styles.indicator,
						{ backgroundColor: currentThemePrimary },
						indicatorStyle,
						indicatorAnimatedStyle,
					]}
					pointerEvents='box-none'
				/>
			</View>
		</Animated.ScrollView>
	);
}, (prevProps, nextProps) => {
	if (prevProps.activeTab !== nextProps.activeTab) return false;
	if (prevProps.tabs !== nextProps.tabs) return false;
	if (prevProps.iconColors.length !== nextProps.iconColors.length) return false;

	for (let i = 0; i < prevProps.iconColors.length; i++) {
		if (prevProps.iconColors[i] !== nextProps.iconColors[i]) return false;
	}

	return true;
});

export const useIsTabActive = (tabIndex: number) => {
	const activeTab = React.useContext(ActiveTabContext);
	return activeTab === tabIndex;
};

export const useParentScroll = () => {
	return React.useContext(UseParentScrollContext);
};

export interface TabConfig {
	backgroundColor?: string;
	text?: string;
	icon?: React.ComponentType<{ size?: number; color?: string; }>;
	content: React.ComponentType<any>;
}

const TabContent = ({
	Content,
	isActive
}: {
	Content: React.ComponentType<any>;
	isActive: boolean;
}) => {
	return <Content />;
};

interface AnimatedTabsProps {
	tabs: TabConfig[];
	activeTab?: number;
	setActiveTab?: (index: number) => void;
	scrollPosition?: number;
	setScrollPosition?: (position: number) => void;
	getIconColor?: (tabIndex: number, scrollPosition: number, width: number) => string;
	containerStyle?: ViewStyle;
	tabsContainerStyle?: ViewStyle;
	tabStyle?: ViewStyle;
	pagesStyle?: ViewStyle;
	bouncing?: boolean;
	activeTabStyle?: ViewStyle;
	indicatorStyle?: ViewStyle;
	contentContainerStyle?: ViewStyle;
	contentHeight?: DimensionValue;
	iconSize?: number;
	tabMaxHeight?: number;
	blurView?: boolean;
	intensity?: number;
	noBorderRadius?: boolean;
	onSwap?: (index: number) => void;
	simple?: boolean;
	isTabBlurView?: boolean;
	tabBlurIntensity?: number;
	preRenderAll?: boolean;
	useParentScroll?: boolean;
	scrollY?: SharedValue<number>;
}

export const AnimatedTabs = observer(({
	tabs,
	getIconColor = getIconColorDefault,
	containerStyle,
	tabsContainerStyle,
	tabStyle = { paddingVertical: 12 },
	activeTabStyle,
	noBorderRadius = false,
	pagesStyle,
	indicatorStyle,
	blurView = false,
	contentContainerStyle,
	contentHeight,
	intensity = 30,
	iconSize = 20,
	tabMaxHeight,
	onSwap,
	bouncing = true,
	simple = false,
	isTabBlurView = false,
	tabBlurIntensity = 30,
	preRenderAll = true,
	useParentScroll = false,
	scrollY
}: AnimatedTabsProps) => {
	const { currentTheme, getBlurViewBgColor, safeAreaWithContentHeight: { safeAreaWithContentHeight } } = themeStore;
	const tabCount = tabs.length;
	const navigation = useNavigation();

	const [activeTab, setActiveTab] = useState(0);
	const [scrollPosition, setScrollPosition] = useState(0);
	const [throttledScrollPosition, setThrottledScrollPosition] = useState(0);

	const [renderedTabs] = useState<Set<number>>(() => {
		if (preRenderAll) {
			return new Set(Array.from({ length: tabCount }, (_, i) => i));
		}
		return new Set([0]);
	});

	const { width } = useWindowDimensions();
	const [scrollViewWidth] = useState(width);
	const scrollViewRef = useRef<any>(null);
	const tabsScrollViewRef = useRef<ScrollView>(null);
	const tabRefs = useRef<(View | null)[]>(new Array(tabCount).fill(null));
	const tabLayouts = useRef<{ x: number; width: number; textX: number; textWidth: number; }[]>(
		new Array(tabCount).fill(null).map(() => ({ x: 0, width: 0, textX: 0, textWidth: 0 }))
	);
	const tabLayoutsShared = useSharedValue<{ x: number; width: number; textX: number; textWidth: number; }[]>(
		new Array(tabCount).fill(null).map(() => ({ x: 0, width: 0, textX: 0, textWidth: 0 }))
	);
	const initialScrollDone = useRef(false);
	const scrollPositions = useRef<number[]>(new Array(tabCount).fill(0));
	const scrollX = useSharedValue(scrollPosition);

	useEffect(() => {
		if (tabLayouts.current.length !== tabCount) {
			const newLayouts = new Array(tabCount).fill(null).map((_, i) =>
				tabLayouts.current[i] || { x: 0, width: 0, textX: 0, textWidth: 0 }
			);
			tabLayouts.current = newLayouts;
			tabLayoutsShared.value = [...newLayouts];
			tabRefs.current = new Array(tabCount).fill(null);
			scrollPositions.current = new Array(tabCount).fill(0);
		}
	}, [tabCount]);

	const updateIndicator = useCallback((index: number) => {
	}, []);

	const scrollToActiveTab = useCallback((index: number) => {
		if (!tabsScrollViewRef.current || !tabRefs.current[index] || index < 0 || index >= tabCount || index >= tabLayouts.current.length) return;

		setTimeout(() => {
			const layout = tabLayouts.current[index];
			if (!layout || isNaN(layout.width) || isNaN(layout.x)) return;

			const targetX = layout.x - (width / 2) + (layout.width / 2);
			tabsScrollViewRef.current?.scrollTo({
				x: Math.max(0, targetX),
				animated: true
			});
		}, 50);
	}, [width, tabCount]);

	useEffect(() => {
		if (!simple) {
			updateIndicator(activeTab);
			scrollToActiveTab(activeTab);
		}
	}, [activeTab, updateIndicator, scrollToActiveTab, simple]);

	useEffect(() => {
		if (!simple && !initialScrollDone.current && scrollViewRef.current) {
			const timer = setTimeout(() => {
				scrollViewRef.current?.scrollTo({ x: activeTab * width, animated: false });
				initialScrollDone.current = true;

				requestAnimationFrame(() => {
					updateIndicator(activeTab);
				});
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [activeTab, updateIndicator, width, simple]);

	useEffect(() => {
		if (!simple && initialScrollDone.current && scrollViewRef.current && scrollPositions.current[activeTab] > 0) {
			const savedScrollPosition = scrollPositions.current[activeTab];
			const tabPosition = Math.round(savedScrollPosition / scrollViewWidth) * scrollViewWidth;

			const finalPosition = Math.abs(savedScrollPosition - tabPosition) < 10 ? tabPosition : savedScrollPosition;

			scrollViewRef.current?.scrollTo({ x: finalPosition, animated: false });
		}
	}, [activeTab, scrollViewWidth, simple]);

	useEffect(() => {
		const isAtStart = scrollPosition < 10;
		navigation.setOptions({
			gestureEnabled: activeTab === 0 && isAtStart
		});
	}, [activeTab, scrollPosition, navigation]);

	const handleTabPress = useCallback((index: number) => {
		if (simple) {
			setActiveTab(index);

			const isJump = Math.abs(index - activeTab) > 1;
			scrollViewRef.current?.scrollTo({
				x: index * width,
				animated: !isJump
			});

			onSwap && onSwap(index);
			return;
		}

		if (scrollViewRef.current) {
			scrollPositions.current[activeTab] = scrollX.value;
		}

		setActiveTab(index);

		const targetX = index * width;
		scrollX.value = targetX;

		const savedPosition = scrollPositions.current[index];
		if (savedPosition > 0) {
			scrollViewRef.current?.scrollTo({ x: savedPosition, animated: false });
		} else {
			scrollViewRef.current?.scrollTo({ x: targetX, animated: false });
		}

		onSwap && onSwap(index);
	}, [simple, activeTab, width, scrollX, onSwap]);

	const lastScrollX = useRef(0);

	const setScrollPositionCallback = useCallback((position: number) => {
		setScrollPosition(position);
		setThrottledScrollPosition(prev => {
			const diff = Math.abs(position - prev);
			return diff > 100 ? position : prev;
		});
	}, []);

	const iconColorsRef = useRef<string[]>([]);
	const lastThrottledPositionRef = useRef<number>(throttledScrollPosition);

	const iconColors = useMemo(() => {
		if (iconColorsRef.current.length !== tabs.length ||
			Math.abs(lastThrottledPositionRef.current - throttledScrollPosition) > 150) {
			iconColorsRef.current = tabs.map((_, tabIndex) =>
				getIconColor(tabIndex, throttledScrollPosition, width)
			);
			lastThrottledPositionRef.current = throttledScrollPosition;
		}
		return iconColorsRef.current;
	}, [tabs.length, throttledScrollPosition, width, getIconColor]);

	const handleScroll = useAnimatedScrollHandler({
		onBeginDrag: (event) => {
			lastScrollX.current = event.contentOffset.x;
		},
		onScroll: (event) => {
			'worklet';
			const offsetX = event.contentOffset.x;
			scrollX.value = offsetX;
			lastScrollX.current = offsetX;
		},
		onMomentumEnd: (event) => {
			'worklet';
			const offsetX = event.contentOffset.x;
			const newIndex = Math.round(offsetX / width);

			if (!simple) {
				scrollPositions.current[activeTab] = offsetX;
			}

			runOnJS(setScrollPositionCallback)(offsetX);

			if (newIndex !== activeTab) {
				runOnJS(setActiveTab)(newIndex);
				if (onSwap) {
					runOnJS(onSwap)(newIndex);
				}
			}
		},
		onEndDrag: (event) => {
			'worklet';
			const offsetX = event.contentOffset.x;
			runOnJS(setScrollPositionCallback)(offsetX);
		}
	});


	const pageStyle = useMemo(() => ({
		flex: undefined,
	}), []);

	const renderedTabContents = useMemo(() => {
		return tabs.map(({ content: Content, backgroundColor }, index) => {
			const shouldRender = preRenderAll || renderedTabs.has(index);

			return (
				<View
					style={[
						styles.page,
						{
							width,
							backgroundColor: backgroundColor || currentTheme.bg_200,
							...pageStyle,
							...(useParentScroll ? { flexGrow: 1 } : {}),
							...(useParentScroll ? {} : { minHeight: tabMaxHeight || undefined }),
							...(useParentScroll ? {} : (tabMaxHeight ? { maxHeight: tabMaxHeight } : {}))
						},
						pagesStyle
					]}
					key={index}
				>
					<ActiveTabContext.Provider value={activeTab}>
						<UseParentScrollContext.Provider value={useParentScroll}>
							{shouldRender ? (
								<TabContent
									Content={Content}
									isActive={activeTab === index}
								/>
							) : null}
						</UseParentScrollContext.Provider>
					</ActiveTabContext.Provider>
				</View>
			);
		});
	}, [tabs, preRenderAll, renderedTabs, width, currentTheme.bg_200, tabMaxHeight, activeTab, pageStyle, useParentScroll]);

	const Component = blurView ? BlurUi : View;
	const AnimatedBlurView = ReactNativeAnimated.createAnimatedComponent(BlurUi);
	const TabComponent = isTabBlurView ? AnimatedBlurView : Animated.View;

	const stickyTabsStyle = useAnimatedStyle(() => {
		'worklet';
		return {};
	}, []);

	return (
		<Component
			style={[
				{
					backgroundColor: blurView ? getBlurViewBgColor() : "transparent",
					borderTopLeftRadius: noBorderRadius ? 0 : 10,
					borderTopRightRadius: noBorderRadius ? 0 : 10,
				},
				styles.container,
				containerStyle
			]}
			intensity={intensity}
			pointerEvents='box-none'
		>
			<TabComponent
				intensity={tabBlurIntensity}
				style={[
					styles.tabsContainer,
					{
						backgroundColor: blurView ? getBlurViewBgColor() : currentTheme.bg_200,
						borderBottomColor: currentTheme.border_100,
					},
					tabsContainerStyle,
					stickyTabsStyle
				]}
				pointerEvents='box-none'
			>
				<TabsContainer
					tabs={tabs}
					activeTab={activeTab}
					iconColors={iconColors}
					iconSize={iconSize}
					tabStyle={tabStyle}
					activeTabStyle={activeTabStyle}
					simple={simple}
					currentThemeText={currentTheme.text_100}
					tabsScrollViewRef={tabsScrollViewRef}
					tabRefs={tabRefs}
					tabLayouts={tabLayouts}
					tabLayoutsShared={tabLayoutsShared}
					tabCount={tabCount}
					handleTabPress={handleTabPress}
					updateIndicator={updateIndicator}
					scrollX={scrollX}
					width={width}
					scrollViewWidth={scrollViewWidth}
					indicatorStyle={indicatorStyle}
					currentThemePrimary={currentTheme.primary_100}
				/>
			</TabComponent>

			<Animated.ScrollView
				ref={scrollViewRef}
				horizontal
				pagingEnabled
				bounces={bouncing}
				showsHorizontalScrollIndicator={false}
				onScroll={handleScroll}
				scrollEventThrottle={16}
				removeClippedSubviews={true}
				style={[
					styles.pagesContainer,
					contentContainerStyle,
					{
						backgroundColor: "transparent",
						...(Platform.OS === 'ios' && { clipsToBounds: false }),
						...(useParentScroll ? { flexGrow: 1 } : {})
					}
				]}
				contentContainerStyle={useParentScroll ? { flexGrow: 1 } : undefined}
			>
				{renderedTabContents}
			</Animated.ScrollView>
		</Component>
	);
});

const styles = StyleSheet.create({
	container: {
		overflow: 'hidden',
		flex: 1,
	},
	tabsContainer: {
		flexDirection: 'row',
		position: 'relative',
		borderBottomWidth: 0.3,
		height: 45,
		maxHeight: 45,
	},
	indicator: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		height: 4,
		borderTopRightRadius: 2,
		borderTopLeftRadius: 2,
	},
	tab: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 10,
		alignItems: 'center',
		paddingHorizontal: 16,
		minWidth: 80,
	},
	activeTab: {
	},
	pagesContainer: {
		flex: 1
	},
	page: {
		flex: 1
	}
});

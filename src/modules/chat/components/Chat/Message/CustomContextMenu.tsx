import { MaterialIcons } from "@expo/vector-icons"
import React, { useEffect, useRef, useState } from "react"
import { Dimensions, Pressable, StyleSheet, Text, Vibration, View } from "react-native"
import {
	Gesture,
	GestureDetector,
} from "react-native-gesture-handler"
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated"

const { width, height } = Dimensions.get("window")

const OPTIONS = [
	{ label: "Copy", icon: "content-copy" },
	{ label: "Forward", icon: "forward" },
	{ label: "Delete", icon: "delete" },
]

export const CustomContextMenu = ({
	visible,
	onClose,
	onSelect,
	position,
}: {
	visible: boolean
	onClose: () => void
	onSelect: (option: string) => void
	position: { x: number; y: number }
}) => {
	const selectedIndex = useRef<number | null>(null)
	const [layoutYPositions, setLayoutYPositions] = useState<number[]>([])
	const [activeIndex, setActiveIndex] = useState<number | null>(null)

	const opacity = useSharedValue(0)
	const scale = useSharedValue(0.95)

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: withTiming(opacity.value, { duration: 150 }),
		transform: [{ scale: withTiming(scale.value, { duration: 150 }) }],
	}))

	const gesture = Gesture.Simultaneous(
		Gesture.Pan()
			.onUpdate((e) => {
				layoutYPositions.forEach((y, index) => {
					if (e.absoluteY >= y && e.absoluteY <= y + 40) {
						if (selectedIndex.current !== index) {
							selectedIndex.current = index
							runOnJS(setActiveIndex)(index)
							runOnJS(Vibration.vibrate)(10)
						}
					}
				})
			})
			.onEnd(() => {
				if (selectedIndex.current !== null) {
					runOnJS(onSelect)(OPTIONS[selectedIndex.current].label)
				}
				runOnJS(setActiveIndex)(null)
				runOnJS(onClose)()
			}),

		Gesture.Pan()
			.onUpdate((e) => {
				if (Math.abs(e.translationX) > 50) {
					runOnJS(onClose)()
				}
			})
	)

	useEffect(() => {
		if (visible) {
			opacity.value = 1
			scale.value = 1
		} else {
			opacity.value = 0
			scale.value = 0.95
		}
	}, [visible])

	if (!visible) return null

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				style={[
					styles.menu,
					animatedStyle,
					{ top: position.y, left: position.x },
				]}
			>
				{OPTIONS.map((option, index) => (
					<Pressable
						key={option.label}
						style={[
							styles.menuItem,
							activeIndex === index && styles.activeItem,
						]}
						onLayout={(e) => {
							const y = e.nativeEvent.layout.y + position.y
							setLayoutYPositions((prev) => {
								const copy = [...prev]
								copy[index] = y
								return copy
							})
						}}
					>
						<View style={styles.row}>
							<MaterialIcons name={option.icon as any} size={20} color="#333" style={styles.icon} />
							<Text style={styles.menuText}>{option.label}</Text>
						</View>
					</Pressable>
				))}
			</Animated.View>
		</GestureDetector>
	)
}

const styles = StyleSheet.create({
	menu: {
		position: "absolute",
		backgroundColor: "white",
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: 10,
		elevation: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
	},
	menuItem: {
		height: 40,
		justifyContent: "center",
		paddingHorizontal: 10,
		borderRadius: 6,
	},
	activeItem: {
		backgroundColor: "#e0e0e0",
	},
	menuText: {
		fontSize: 16,
	},
	icon: {
		marginRight: 8,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
	},
})

import { makeAutoObservable } from 'mobx'
import { Animated as AnimatedRn, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { ReanimatedScrollEvent } from 'react-native-reanimated/lib/typescript/hook/commonTypes'

class ScrollInteractionsStore {
	constructor() {
		makeAutoObservable(this)
	}

	refreshControllScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>, progress: AnimatedRn.Value) => {
		const offsetY = event.nativeEvent.contentOffset.y

		if (offsetY < 0) {
			const MAX_PULL_DISTANCE = 100
			const progressValue = Math.min(Math.abs(offsetY) / MAX_PULL_DISTANCE, 1)
			if (progress && typeof progress.setValue === 'function') {
				progress.setValue(progressValue)
			}
		} else {
			if (progress && typeof progress.setValue === 'function') {
				progress.setValue(0)
			}
		}
	}

	refreshControllReanimatedScrollHandler = (event: ReanimatedScrollEvent, progress: AnimatedRn.Value) => {
		const offsetY = event.contentOffset.y

		if (offsetY < 0) {
			const MAX_PULL_DISTANCE = 100
			const progressValue = Math.min(Math.abs(offsetY) / MAX_PULL_DISTANCE, 1)
			if (progress && typeof progress.setValue === 'function') {
				progress.setValue(progressValue)
			}
		} else {
			if (progress && typeof progress.setValue === 'function') {
				progress.setValue(0)
			}
		}
	}

}

export const scrollInteractionsStore = new ScrollInteractionsStore()
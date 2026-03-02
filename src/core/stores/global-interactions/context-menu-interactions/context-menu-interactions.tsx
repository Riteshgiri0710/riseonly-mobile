import { makeAutoObservable } from 'mobx'

class ContextMenuInteractions {
	constructor() { makeAutoObservable(this) }

	itemCordinates = { x: 0, y: 0 }

	onLongPress = (e: any) => {
		const { pageY, locationY } = e.nativeEvent
		let y = pageY - locationY

		this.itemCordinates = {
			x: 0,
			y,
		}
	}
}

export function useMobxContextMenu() {
	return new ContextMenuInteractions()
}
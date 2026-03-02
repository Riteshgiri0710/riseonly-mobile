import React from 'react';
import { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { TransformOriginAnchorPosition } from '../../utils/calculations';
import { MenuItemProps } from '../menu/types';

export type HoldItemProps = {
	/**
	 * Set true if you want to use text as a child
	 * @type boolean
	 * @default false
	 * @examples
	 * text={true}
	 */
	text?: boolean;

	/**
	 * List of context menu items.
	 * @type MenuItemProps[]
	 * @default []
	 */
	items: MenuItemProps[];

	/**
	 * Object of keys that same name with items to match parameters to onPress actions.
	 * @type { [name: string]: (string | number)[] }
	 * @examples
	 * ```js
	 * const items = [
	 *  {text: 'Reply', onPress: (messageId) => {}},
	 *  {text: 'Copy', onPress: (messageText) => {}},
	 * ]
	 * ...
	 * <HoldItem
	 *    items={items}
	 *    actionParams={{
	 *      Reply: ['dd443224-7f43'],
	 *      Copy: ['Hello World!']
	 *    }}
	 * ><View/></HoldItem>
	 * ```
	 */
	actionParams?: {
		[name: string]: any[];
	};

	children: React.ReactElement | React.ReactElement[];

	/**
	 * Menu anchor position is calculated automaticly.
	 * But you can override the calculation by passing an anchor position.
	 * @type TransformOriginAnchorPosition
	 * @examples
	 * menuAnchorPosition="top-bottom"
	 */
	menuAnchorPosition?: TransformOriginAnchorPosition;

	/**
	 * Disables moving holded item
	 * @type boolean
	 * @default false
	 * @examples
	 * disableMove={true}
	 */
	disableMove?: boolean;

	/**
	 * HoldItem wrapper component styles.
	 * You may need for some examples like dynamic width or hight like message boxes.
	 * See Whatsapp example.
	 * @type ViewStyles
	 * @default {}
	 * @examples
	 * containerStyles={{ maxWidth: '80%' }}
	 */
	containerStyles?: ViewStyle | ViewStyle[];

	/**
	 * Theme for menu background and texts
	 * @type string
	 * @examples
	 * theme="light"
	 */
	theme?: 'light' | 'dark';

	/**
	 * Set true if you want to open menu from bottom
	 * @type boolean
	 * @default false
	 * @examples
	 * bottom={true}
	 */
	bottom?: boolean;

	/**
	 * Set if you'd like a different tap activation
	 * @type string
	 * @default 'hold'
	 * @examples
	 * activateOn="hold"
	 */
	activateOn?: 'tap' | 'double-tap' | 'hold';

	/**
	 * Set if you'd like to enable haptic feedback on activation
	 * @type string
	 * @default 'Medium'
	 * @examples
	 * hapticFeedback="None"
	 */
	hapticFeedback?:
	| 'None'
	| 'Selection'
	| 'Light'
	| 'Medium'
	| 'Heavy'
	| 'Success'
	| 'Warning'
	| 'Error';

	/**
	 * Set true if you want to close menu when tap to HoldItem
	 * @type boolean
	 * @default false
	 * @examples
	 * closeOnTap={true}
	 */
	closeOnTap?: boolean;

	/**
	 * Set delay before long tap will activate gesture. May be useful to increase this value in lists
	 * @type number
	 * @default 150
	 * @examples
	 * longPressMinDurationMs={250}
	 */
	longPressMinDurationMs?: number;

	/**
	 * Custom styles for the menu container
	 * @type ViewStyle
	 * @default {}
	 * @examples
	 * menuStyle={{ borderRadius: 16 }}
	 */
	menuStyle?: ViewStyle | ViewStyle[];

	/**
	 * Custom width for the menu
	 * @type number
	 * @default 200
	 * @examples
	 * menuWidth={250}
	 */
	menuWidth?: number;

	/**
	 * Set if you'd like to call a function when long press is triggered
	 * @type () => void
	 * @default null
	 * @examples
	 * onLongPress={() => {}}
	 */
	onLongPress?: () => void;

	/**
	 * Offset for menu position
	 * @type { x?: number; y?: number; }
	 * @default { x: 0, y: 0 }
	 * @examples
	 * menuOffset={{ x: -10, y: 5 }}
	 */
	menuOffset?: { x?: number; y?: number; };

	/**
	 * Scale when long-press is active (e.g. 0.935 = 6.5% press-in). Makes the "вдавливание" more visible.
	 * @type number
	 * @default 0.95
	 * @examples
	 * scaleDownValue={0.9}
	 */
	scaleDownValue?: number;

	activeHoldMessageIdShared?: SharedValue<string | null>;
	itemId?: string;
};

export type GestureHandlerProps = {
	children: React.ReactElement | React.ReactElement[];
};


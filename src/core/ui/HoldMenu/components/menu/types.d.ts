import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { TransformOriginAnchorPosition } from '../../utils/calculations';

export type MenuItemProps = {
	text: string;
	icon?: string | React.ReactNode | (() => React.ReactElement);
	onPress?: (...args: any[]) => void;
	isTitle?: boolean;
	isLabel?: boolean;
	isDestructive?: boolean;
	withSeparator?: boolean;
	isBottom?: boolean;
	style?: StyleProp<ViewStyle>;
};

export type MenuListProps = {
	items: MenuItemProps[];
};


export type MenuInternalProps = {
	items: MenuItemProps[];
	itemHeight: number;
	itemWidth: number;
	itemY: number;
	itemX: number;
	anchorPosition: TransformOriginAnchorPosition;
	menuHeight: number;
	transformValue: number;
	actionParams: {
		[name: string]: (string | number)[];
	};
	menuStyle?: StyleProp<ViewStyle>;
	menuWidth?: number;
	menuOffset?: { x?: number; y?: number; };
};


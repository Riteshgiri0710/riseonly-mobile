import React from 'react';
import { createContext } from 'react';
import type Animated from 'react-native-reanimated';
import { MenuInternalProps } from '../components/menu/types';
import type { CONTEXT_MENU_STATE } from '../constants';

export type InternalContextType = {
	state: Animated.SharedValue<CONTEXT_MENU_STATE>;
	theme: Animated.SharedValue<'light' | 'dark'>;
	menuProps: Animated.SharedValue<MenuInternalProps>;
	safeAreaInsets?: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
};

// @ts-ignore
export const InternalContext = createContext<InternalContextType>();


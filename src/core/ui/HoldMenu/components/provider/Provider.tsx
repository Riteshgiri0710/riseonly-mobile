import { PortalProvider } from '@gorhom/portal';
import React, { memo, useEffect, useMemo, useState } from 'react';
import Animated, { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

// Components
import { Backdrop } from '../backdrop';
import { CustomOverlay } from '../overlay';

// Utils
import { CONTEXT_MENU_STATE } from '../../constants';
import { InternalContext } from '../../context/internal';
import { MenuTopContentContext } from '../../context/menuTopContent';
import Menu from '../menu';
import { MenuInternalProps } from '../menu/types';
import { Action, StateProps } from './reducer';
import { HoldMenuProviderProps } from './types';

export interface Store {
	state: StateProps;
	dispatch?: React.Dispatch<Action>;
}

export let AnimatedIcon: any;

const ProviderComponent = ({
	children,
	theme: selectedTheme,
	iconComponent,
	safeAreaInsets,
	onOpen,
	onClose,
	menuTopContent: menuTopContentProp,
}: HoldMenuProviderProps) => {
	if (iconComponent)
		AnimatedIcon = Animated.createAnimatedComponent(iconComponent);

	const state = useSharedValue<CONTEXT_MENU_STATE>(
		CONTEXT_MENU_STATE.UNDETERMINED
	);
	const theme = useSharedValue<'light' | 'dark'>(selectedTheme || 'light');
	const [menuTopContent, setMenuTopContentState] = useState<React.ReactNode | null>(menuTopContentProp ?? null);
	const menuProps = useSharedValue<MenuInternalProps>({
		itemHeight: 0,
		itemWidth: 0,
		itemX: 0,
		itemY: 0,
		items: [],
		anchorPosition: 'top-center',
		menuHeight: 0,
		transformValue: 0,
		actionParams: {},
	});

	useEffect(() => {
		theme.value = selectedTheme || 'light';
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedTheme]);

	useAnimatedReaction(
		() => state.value,
		s => {
			'worklet';
			switch (s) {
				case CONTEXT_MENU_STATE.ACTIVE: {
					if (onOpen)
						runOnJS(onOpen)();
					break;
				}
				case CONTEXT_MENU_STATE.END: {
					if (onClose)
						runOnJS(onClose)();
					break;
				}
			}
		},
		[state, onOpen, onClose]
	);

	const setMenuTopContent = useMemo(
		() => (node: React.ReactNode | null) => {
			setMenuTopContentState(node);
		},
		[]
	);

	useEffect(() => {
		if (menuTopContentProp !== undefined) {
			setMenuTopContentState(menuTopContentProp);
		}
	}, [menuTopContentProp]);

	const internalContextVariables = useMemo(
		() => ({
			state,
			theme,
			menuProps,
			safeAreaInsets: safeAreaInsets || {
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
			},
		}),
		[state, theme, menuProps, safeAreaInsets]
	);

	const menuTopContentContextValue = useMemo(
		() => ({
			menuTopContent,
			setMenuTopContent,
		}),
		[menuTopContent, setMenuTopContent]
	);

	return (
		<InternalContext.Provider value={internalContextVariables}>
			<MenuTopContentContext.Provider value={menuTopContentContextValue}>
				<PortalProvider>
					{children}
					<Backdrop />
					<CustomOverlay />
					<Menu />
				</PortalProvider>
			</MenuTopContentContext.Provider>
		</InternalContext.Provider>
	);
};

const Provider = memo(ProviderComponent);

export default Provider;


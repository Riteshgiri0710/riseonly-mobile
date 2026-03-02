import { RootStackParamList } from '@app/router';
import type { ParamListBase } from '@react-navigation/native';
import { CommonActions, StackActions, createNavigationContainerRef } from '@react-navigation/native';
import { routeInteractions } from '@stores/global-interactions';

export const navigationRef = createNavigationContainerRef<ParamListBase>();

export function navigate<RouteName extends keyof RootStackParamList>(
	...args: RouteName extends unknown
		? undefined extends RootStackParamList[RouteName]
		? [screen: RouteName, params?: RootStackParamList[RouteName]]
		: [screen: RouteName, params: RootStackParamList[RouteName]]
		: never
): void {
	const [name, params] = args;
	routeInteractions.pushRoute({ name: name as string, params });

	if (navigationRef.isReady()) {
		navigationRef.navigate(name as keyof ParamListBase, params as ParamListBase[keyof ParamListBase]);
	}
}

export function push<RouteName extends keyof RootStackParamList>(
	...args: RouteName extends unknown
		? undefined extends RootStackParamList[RouteName]
		? [screen: RouteName, params?: RootStackParamList[RouteName]]
		: [screen: RouteName, params: RootStackParamList[RouteName]]
		: never
): void {
	const [name, params] = args;
	if (navigationRef.isReady()) {
		navigationRef.dispatch(StackActions.push(name as string, params));
	}
}

export function goBack() {
	routeInteractions.popRoute();

	if (navigationRef.isReady() && navigationRef.canGoBack()) {
		navigationRef.goBack();
	}
}

export function pop(count: number = 1) {
	if (navigationRef.isReady()) {
		navigationRef.dispatch(StackActions.pop(count));
	}
}

export function popToTop() {
	if (navigationRef.isReady()) {
		navigationRef.dispatch(StackActions.popToTop());
	}
}

export function replace(name: string, params?: any) {
	if (navigationRef.isReady()) {
		navigationRef.dispatch(StackActions.replace(name, params));
	}
}

export function reset(state: any) {
	if (navigationRef.isReady()) {
		navigationRef.dispatch(CommonActions.reset(state));
	}
}

export function canGoBack(): boolean {
	return navigationRef.isReady() ? navigationRef.canGoBack() : false;
}

export function getCurrentRoute() {
	if (navigationRef.isReady()) {
		return navigationRef.getCurrentRoute();
	}
	return null;
}

export function getCurrentRouteName(): string | null {
	const route = getCurrentRoute();
	return route?.name ?? null;
}

export function getState() {
	if (navigationRef.isReady()) {
		return navigationRef.getState();
	}
	return null;
}

export function setParams(params: any) {
	if (navigationRef.isReady()) {
		navigationRef.setParams(params);
	}
}

export const navigationService = {
	navigate,
	push,
	goBack,
	pop,
	popToTop,
	replace,
	reset,
	canGoBack,
	getCurrentRoute,
	getCurrentRouteName,
	getState,
	setParams,
	isReady: () => navigationRef.isReady(),
};


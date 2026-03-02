import { interpolateColor } from '@core/config/tsx';
import { useState } from 'react';
import { themeStore } from 'src/modules/theme/stores';

export const useAnimatedTabs = (initialTab = 0) => {
	const [activeTab, setActiveTab] = useState(initialTab);
	const [scrollPosition, setScrollPosition] = useState(0);

	const getIconColor = (tabIndex: number, width: number) => {
		const mainColor = themeStore.currentTheme.primary_100;
		const secondaryColor = themeStore.currentTheme.secondary_100;

		const virtualCurrentTab = scrollPosition / width;

		const isTransitioningToThisTab =
			(Math.floor(virtualCurrentTab) === tabIndex && virtualCurrentTab < tabIndex + 1) ||
			(Math.ceil(virtualCurrentTab) === tabIndex && virtualCurrentTab > tabIndex - 1);

		if (!isTransitioningToThisTab) {
			return secondaryColor;
		}

		const proximityFactor = 1 - Math.abs(virtualCurrentTab - tabIndex);

		return interpolateColor(secondaryColor, mainColor, proximityFactor);
	};

	return {
		activeTab,
		setActiveTab,
		scrollPosition,
		setScrollPosition,
		getIconColor
	};
}; 
import Animated from 'react-native-reanimated';

import { MENU_WIDTH } from '../../constants';
import {
	MENU_TEXT_DARK_COLOR,
	MENU_TEXT_DESTRUCTIVE_COLOR_DARK,
	MENU_TEXT_DESTRUCTIVE_COLOR_LIGHT,
	MENU_TEXT_LIGHT_COLOR,
	MENU_TITLE_COLOR,
} from './constants';
import type { MenuInternalProps } from './types';

export const leftOrRight = (
  menuProps: Animated.SharedValue<MenuInternalProps>
) => {
  'worklet';

  const anchorPosition = menuProps.value.anchorPosition;
  const itemWidth = menuProps.value.itemWidth;

  // Проверяем позицию без использования split
  const isRight = anchorPosition === 'top-right' || anchorPosition === 'bottom-right';
  const isLeft = anchorPosition === 'top-left' || anchorPosition === 'bottom-left';
  const isCenter = anchorPosition === 'top-center' || anchorPosition === 'bottom-center';

  let leftPosition = 0;
  if (isRight) {
    leftPosition = -MENU_WIDTH + itemWidth;
  } else if (isLeft) {
    leftPosition = 0;
  } else if (isCenter) {
    leftPosition = -menuProps.value.itemWidth - MENU_WIDTH / 2 + menuProps.value.itemWidth / 2;
  }

  return leftPosition;
};

export const getColor = (
  isTitle: boolean | undefined,
  isDestructive: boolean | undefined,
  themeValue: 'light' | 'dark'
) => {
  'worklet';
  return isTitle
    ? MENU_TITLE_COLOR
    : isDestructive
    ? themeValue === 'dark'
      ? MENU_TEXT_DESTRUCTIVE_COLOR_DARK
      : MENU_TEXT_DESTRUCTIVE_COLOR_LIGHT
    : themeValue === 'dark'
    ? MENU_TEXT_DARK_COLOR
    : MENU_TEXT_LIGHT_COLOR;
};


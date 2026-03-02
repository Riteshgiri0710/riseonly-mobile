import {
  FONT_SCALE,
  MENU_TRANSFORM_ORIGIN_TOLERENCE,
  MENU_WIDTH,
} from '../constants';

const STYLE_GUIDE_SPACING = 8;
const STYLE_GUIDE_CALLOUT_LINE_HEIGHT = 20;
const LABEL_ROW_HEIGHT = 20;

export const MenuItemHeight = () => {
  'worklet';
  return (
    STYLE_GUIDE_CALLOUT_LINE_HEIGHT * FONT_SCALE +
    STYLE_GUIDE_SPACING * 2.5
  );
};

export const getLabelRowHeight = () => {
  'worklet';
  return LABEL_ROW_HEIGHT;
};

export const calculateMenuHeight = (
  itemLength: number,
  separatorCount: number,
  labelCount: number = 0
) => {
  'worklet';
  const normalCount = itemLength - labelCount;
  return (
    MenuItemHeight() * Math.max(0, normalCount) +
    labelCount * LABEL_ROW_HEIGHT +
    (itemLength - 1) +
    separatorCount * STYLE_GUIDE_SPACING
  );
};

export type TransformOriginAnchorPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export const menuAnimationAnchor = (
  anchorPoint: TransformOriginAnchorPosition,
  itemWidth: number,
  itemLength: number,
  itemsWithSeparatorLength: number
) => {
  'worklet';
  const MenuHeight = calculateMenuHeight(itemLength, itemsWithSeparatorLength);

  const Center1 = itemWidth;
  const Center2 = 0;

  const TyTop1 = -(MenuHeight / 2);
  const TyTop2 = MenuHeight / 2;

  const TxLeft1 = (MENU_WIDTH / 2) * -1;
  const TxLeft2 = (MENU_WIDTH / 2) * 1;

  // Проверяем позицию без использования split
  const isTop = anchorPoint === 'top-right' || anchorPoint === 'top-left' || anchorPoint === 'top-center';
  const isBottom = anchorPoint === 'bottom-right' || anchorPoint === 'bottom-left' || anchorPoint === 'bottom-center';
  const isRight = anchorPoint === 'top-right' || anchorPoint === 'bottom-right';
  const isLeft = anchorPoint === 'top-left' || anchorPoint === 'bottom-left';
  const isCenter = anchorPoint === 'top-center' || anchorPoint === 'bottom-center';

  return {
    beginningTransformations: {
      translateX:
        isRight
          ? -TxLeft1
          : isLeft
            ? TxLeft1
            : Center1,
      translateY:
        isTop
          ? TyTop1
          : isBottom
            ? TyTop1
            : Center2,
    },
    endingTransformations: {
      translateX:
        isRight
          ? -TxLeft2
          : isLeft
            ? TxLeft2
            : Center2,
      translateY:
        isTop
          ? TyTop2
          : isBottom
            ? -TyTop2
            : Center2,
    },
  };
};

export const getTransformOrigin = (
  posX: number,
  itemWidth: number,
  windowWidth: number,
  bottom?: boolean
): TransformOriginAnchorPosition => {
  'worklet';
  const distanceToLeft = Math.round(posX + itemWidth / 2);
  const distanceToRight = Math.round(windowWidth - distanceToLeft);

  let position: TransformOriginAnchorPosition = bottom
    ? 'bottom-right'
    : 'top-right';

  const majority = Math.abs(distanceToLeft - distanceToRight);

  if (majority < MENU_TRANSFORM_ORIGIN_TOLERENCE) {
    position = bottom ? 'bottom-center' : 'top-center';
  } else if (distanceToLeft < distanceToRight) {
    position = bottom ? 'bottom-left' : 'top-left';
  }

  return position;
};


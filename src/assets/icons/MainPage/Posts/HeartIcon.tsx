import Svg, { Path } from 'react-native-svg';
import { themeStore } from "src/modules/theme/stores";

export const HeartIcon = ({ size = 20, color = themeStore.currentTheme.text_100, filled = false }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 23 21" fill={filled ? color : "none"}>
      <Path d="M10.336 18.9335L10.335 18.9326C7.35891 16.247 4.94927 14.0681 3.27488 12.0296C1.60861 10.0009 0.75 8.20373 0.75 6.29428C0.75 3.17658 3.19287 0.75 6.325 0.75C8.10063 0.75 9.81623 1.57644 10.9321 2.87021L11.5 3.52874L12.0679 2.87021C13.1838 1.57644 14.8994 0.75 16.675 0.75C19.8071 0.75 22.25 3.17658 22.25 6.29428C22.25 8.20373 21.3914 10.0009 19.7251 12.0296C18.0507 14.0681 15.6411 16.247 12.665 18.9326L12.664 18.9335L11.5 19.988L10.336 18.9335Z" stroke={color} strokeWidth="2" />
    </Svg>
  );
};

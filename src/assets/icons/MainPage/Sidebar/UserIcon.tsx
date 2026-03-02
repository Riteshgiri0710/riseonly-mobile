import Svg, { Path } from 'react-native-svg';
import { themeStore } from 'src/modules/theme/stores';

export const UserIcon = ({ size = 24, color = themeStore.currentTheme.text_100 }) => {
   return (
      <Svg width={size} height={size} viewBox="0 0 19 24" fill="none">
         <Path d="M9.4 9.4C11.9957 9.4 14.1 7.29574 14.1 4.7C14.1 2.10426 11.9957 0 9.4 0C6.80426 0 4.7 2.10426 4.7 4.7C4.7 7.29574 6.80426 9.4 9.4 9.4Z" fill={color} />
         <Path d="M18.8 18.2125C18.8 21.1324 18.8 23.5 9.4 23.5C0 23.5 0 21.1324 0 18.2125C0 15.2926 4.20885 12.925 9.4 12.925C14.5911 12.925 18.8 15.2926 18.8 18.2125Z" fill={color} />
      </Svg>
   );
};
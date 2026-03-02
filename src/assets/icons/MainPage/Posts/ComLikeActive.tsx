import Svg, { Path } from 'react-native-svg';
import { themeStore } from 'src/modules/theme/stores';

export const ComLikeActive = ({ size = 14, color = themeStore.currentTheme.primary_100 }) => {
   return (
      <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
         <Path d="M14 6.3C14 5.9287 13.8659 5.5726 13.6272 5.31005C13.3885 5.0475 13.0648 4.9 12.7273 4.9H8.70545L9.31636 1.701C9.32909 1.631 9.33545 1.554 9.33545 1.477C9.33545 1.19 9.22727 0.924 9.05545 0.735L8.38091 0L4.19364 4.606C3.95818 4.865 3.81818 5.215 3.81818 5.6V12.6C3.81818 12.9713 3.95227 13.3274 4.19095 13.5899C4.42964 13.8525 4.75336 14 5.09091 14H10.8182C11.3464 14 11.7982 13.65 11.9891 13.146L13.9109 8.211C13.9682 8.05 14 7.882 14 7.7V6.3ZM0 14H2.54545V5.6H0V14Z" fill={color} />
      </Svg>
   );
};
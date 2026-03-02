import Svg, { Path } from 'react-native-svg';
import { themeStore } from 'src/modules/theme/stores';

export const CommentIcon = ({ size = 20, color = themeStore.currentTheme.text_100 }) => {
   return (
      <Svg width={size} height={size} viewBox="0 0 21 20" fill="none">
         <Path d="M10.7524 19C12.5149 19 14.2377 18.4722 15.7031 17.4832C17.1685 16.4943 18.3106 15.0887 18.985 13.4442C19.6595 11.7996 19.8359 9.99002 19.4921 8.24419C19.1483 6.49836 18.2996 4.89472 17.0534 3.63604C15.8072 2.37737 14.2194 1.5202 12.4909 1.17294C10.7623 0.82567 8.97065 1.0039 7.34239 1.68509C5.71414 2.36628 4.32245 3.51983 3.34331 4.99987C2.36417 6.47991 1.84155 8.21997 1.84155 10C1.84155 11.488 2.19799 12.891 2.83165 14.127L1.84155 19L6.66631 18C7.89007 18.64 9.28017 19 10.7524 19Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
   );
};
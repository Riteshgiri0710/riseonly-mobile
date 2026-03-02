import Svg, { Path } from 'react-native-svg';

export const UnreadedIcon = ({ size = 15, color = 'currentColor' }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 12 10'
      fill='none'
    >
      <Path
        d='M4.196 10 0 5.26l1.05-1.185L4.195 7.63 10.951 0 12 1.185z'
        fill={color}
      />
    </Svg>
  );
};

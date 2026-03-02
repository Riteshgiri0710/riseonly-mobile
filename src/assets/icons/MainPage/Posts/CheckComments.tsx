import Svg, { Path } from 'react-native-svg';
import { IconWithSize } from '../../../../core/utils/globalTypes';

export const CheckCommentsIcon = ({ size = 17, color = 'white' }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 17 17'
      fill='none'
    >
      <Path
        d='m15.97 10.882-4.99 4.94-4.99-4.94M1 1h3.327c1.764 0 3.457.694 4.704 1.93a6.56 6.56 0 0 1 1.949 4.658v1.811'
        stroke={color}
      />
    </Svg>
  );
};

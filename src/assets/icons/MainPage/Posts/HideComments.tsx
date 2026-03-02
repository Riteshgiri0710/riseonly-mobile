import Svg, { Path } from 'react-native-svg';
import { IconWithSize } from '../../../../core/utils/globalTypes';

export const HideComments = ({ size = 17, color = "white" }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 17 17'
      fill='none'
    >
      <Path
        d='M15.97 5.94 10.98 1 5.99 5.94M1 15.822h3.327a6.7 6.7 0 0 0 4.704-1.93 6.56 6.56 0 0 0 1.949-4.658V7.423'
        stroke={color}
      />
    </Svg>
  );
};

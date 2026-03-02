import Svg, { Path } from 'react-native-svg';
import { IconWithSize } from '../../../../core/utils/globalTypes';

export const CloseReply = ({ size = 24, color = '"#BABABA"' }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
    >
      <Path
        d='M12 0C5.364 0 0 5.364 0 12s5.364 12 12 12 12-5.364 12-12S18.636 0 12 0m5.16 17.16a1.195 1.195 0 0 1-1.692 0L12 13.692 8.532 17.16a1.196 1.196 0 1 1-1.692-1.692L10.308 12 6.84 8.532A1.196 1.196 0 0 1 8.532 6.84L12 10.308l3.468-3.468a1.197 1.197 0 0 1 1.692 1.692L13.692 12l3.468 3.468c.456.456.456 1.224 0 1.692'
        fill={color}
      />
    </Svg>
  );
};

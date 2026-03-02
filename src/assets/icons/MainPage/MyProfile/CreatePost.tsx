import Svg, { Path } from 'react-native-svg';
import { IconWithSize } from '../../../../core/utils/globalTypes';

export const CreatePostIcon = ({ size = 20, color = 'white' }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 22 19'
      fill='none'
    >
      <Path
        d='M20.958 4.266c-.402.36-.793.708-.805 1.056-.035.338.367.686.746 1.013.568.528 1.124 1.003 1.1 1.52-.023.517-.627 1.055-1.23 1.583l-4.888 4.37-1.68-1.5 5.03-4.474-1.137-1.013-1.68 1.488-4.438-3.958L16.52.309c.462-.412 1.23-.412 1.669 0l2.769 2.47c.461.39.461 1.076 0 1.487M0 15.042l11.313-10.1L15.751 8.9 4.438 19H0z'
        fill={color}
      />
    </Svg>
  );
};

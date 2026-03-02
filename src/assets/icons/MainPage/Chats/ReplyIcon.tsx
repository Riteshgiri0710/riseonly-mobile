import Svg, { Path } from 'react-native-svg';

export const ReplyIcon = ({ size = 30, color = 'currentColor' }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 33 33'
      fill='none'
    >
      <Path
        d='m12.21 24.541-9.42-6.765a1.485 1.485 0 0 1 0-2.553l9.421-6.77a1.477 1.477 0 0 1 2.226 1.278v2.642c3.094 0 12.375 0 14.438 16.5-5.157-9.282-14.438-8.25-14.438-8.25v2.642a1.479 1.479 0 0 1-2.226 1.278z'
        fill={color}
      />
    </Svg>
  );
};

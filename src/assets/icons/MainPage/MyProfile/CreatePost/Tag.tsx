import Svg, { Path } from 'react-native-svg'
import { IconWithSize } from '@/shared/utils/globalTypes'

export const TagIcon = ({ size = 18, color = "#BABABA" }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 18 18'
      fill='none'
    >
      <Path
        d='M3.15 4.5a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7m14.319 4.122-8.1-8.1A1.8 1.8 0 0 0 8.1 0H1.8C.801 0 0 .801 0 1.8v6.3c0 .495.198.945.531 1.269l8.091 8.1c.333.324.783.531 1.278.531s.945-.207 1.269-.531l6.3-6.3A1.76 1.76 0 0 0 18 9.9c0-.504-.207-.954-.531-1.278'
        fill={color}
      />
    </Svg>
  )
}

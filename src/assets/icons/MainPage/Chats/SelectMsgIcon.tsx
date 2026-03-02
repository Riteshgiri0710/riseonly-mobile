import Svg, { Path } from 'react-native-svg'
import { IconWithSize } from '@/shared/utils/globalTypes'

export const SelectMsgIcon = ({ size = 12, color = 'white' }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 13 13'
      fill='none'
    >
      <Path
        d='M5.557 8.66 3.36 6.425l.55-.559 1.648 1.676 3.539-3.597.55.559z'
        fill={color}
      />
      <Path
        d='M6.499 11.907A5.604 5.604 0 1 0 6.499.7a5.604 5.604 0 0 0 0 11.207Z'
        stroke={color}
      />
    </Svg>
  )
}

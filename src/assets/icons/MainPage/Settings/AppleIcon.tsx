import { IconOnlyWithSize } from '@/shared/utils/globalTypes'
import Svg, { Rect } from 'react-native-svg'

export const AppleIcon = ({ size = 22 }: IconOnlyWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 22 22'
      fill='none'
    >
      <Rect width={size} height={size} rx={6} fill='#06F' />
    </Svg>
  )
}


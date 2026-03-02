import Svg, { Rect } from 'react-native-svg'
import { IconOnlyWithSize } from '@/shared/utils/globalTypes'

export const LaptopIcon = ({ size = 22 }: IconOnlyWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 22 22'
      fill='none'
    >
      <Rect width={22} height={22} rx={6} fill='#06F' />
    </Svg>
  )
}

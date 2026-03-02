import Svg, { Path } from 'react-native-svg'
import { IconOnlyWithSize } from '@/shared/utils/globalTypes'

export const GoogleIcon = ({ size = 22 }: IconOnlyWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 22 22'
      fill='none'
      style={{ borderRadius: '6px' }}
    >
      <Path fill='#089900' d='M0 0h22v22H0z' />
      <Path
        d='M6.349 5.79A7 7 0 0 1 11.038 4a7.04 7.04 0 0 1 6.226 3.753h-6.226A3.28 3.28 0 0 0 8.007 9.77z'
        fill='#fff'
      />
      <Path
        d='M5.638 6.523a7.04 7.04 0 0 0 3.2 11.201l2.638-3.432q-.216.03-.438.029a3.284 3.284 0 0 1-3.202-2.548.5.5 0 0 1-.047-.087z'
        fill='#fff'
      />
      <Path
        d='M9.832 17.97q.588.105 1.206.104a7.037 7.037 0 0 0 6.636-9.388l-.068.004h-4.27a3.28 3.28 0 0 1 .986 2.346 3.28 3.28 0 0 1-.894 2.257z'
        fill='#fff'
      />
      <Path
        d='M8.692 11.037a2.346 2.346 0 1 1 4.692 0 2.346 2.346 0 0 1-4.692 0'
        fill='#fff'
      />
    </Svg>
  )
}

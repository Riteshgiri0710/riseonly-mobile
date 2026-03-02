import Svg, { Path } from 'react-native-svg'
import { IconWithWidthAndHeight } from '@/shared/utils/globalTypes'

export const MessageReadedIcon = ({ width = 15, height = 10, color = 'white' }: IconWithWidthAndHeight) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox='0 0 17 10'
      fill='none'
    >
      <Path
        d='M4.196 10 0 5.26l1.05-1.185L4.195 7.63 10.951 0 12 1.185z'
        fill={color}
      />
      <Path
        d='M9.052 10 6 6.875l.45-1.615 2.602 2.37L15.932 0 17 1.185z'
        fill={color}
      />
    </Svg>
  )
}

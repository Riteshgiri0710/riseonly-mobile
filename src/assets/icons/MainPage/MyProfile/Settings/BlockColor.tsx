import Svg, { Path } from 'react-native-svg'
import { IconWithSize } from '@/shared/utils/globalTypes'

export const BlockColor = ({ size = 18, color = "white" }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 18 18'
      fill='none'
    >
      <Path
        d='m9.73 15.824.006.008.007.007A.97.97 0 0 1 10 16.5a1 1 0 0 1-1 1 8.5 8.5 0 1 1 0-17c4.75 0 8.5 3.41 8.5 7.5a4.5 4.5 0 0 1-4.5 4.5h-1.77a2 2 0 0 0-2 2c0 .514.202.976.5 1.324Zm3.356-6.91a2 2 0 1 0 2.828-2.828 2 2 0 0 0-2.828 2.828Zm-3-4a2 2 0 1 0 2.828-2.828 2 2 0 0 0-2.828 2.828Zm-5 0a2 2 0 1 0 2.828-2.828 2 2 0 0 0-2.828 2.828Zm-3 4a2 2 0 1 0 2.828-2.828 2 2 0 0 0-2.828 2.828Z'
        stroke={color}
      />
    </Svg>
  )
}

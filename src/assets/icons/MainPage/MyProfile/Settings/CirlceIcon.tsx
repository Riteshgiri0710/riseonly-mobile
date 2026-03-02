import Svg, { Circle } from 'react-native-svg'
import { IconWithSize } from '@/shared/utils/globalTypes'

export const CircleIcon = ({ size = 18, color = "white" }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 18 18'
      fill='none'
    >
      <Circle cx={9} cy={9} r={8.5} stroke={color} />
    </Svg>
  )
}

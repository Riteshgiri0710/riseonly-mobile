import Svg, { Path } from 'react-native-svg'
import { IconWithSize } from '@/shared/utils/globalTypes'

export const PinMsgIcon = ({ size = 12, color = 'white' }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 11 11'
      fill='none'
    >
      <Path
        d='m10.311 4.2-.326-.172-.26.26L7.73 6.281l-.077.077-.038.101-.895 2.387a.1.1 0 0 1-.017.03l-.024.028-.93.93a.13.13 0 0 1-.163.017l-.032-.028L3.81 8.08l-.354-.354-.353.354L.72 10.463a.129.129 0 0 1-.2-.163l.027-.03L2.92 7.896l.354-.353-.354-.354-1.755-1.755a.13.13 0 0 1-.017-.162l.028-.03.932-.932.025-.02.031-.013 2.376-.892.101-.038.077-.076 1.994-1.992.262-.263L6.8.69a.128.128 0 0 1 .185-.167l.032.028 3.446 3.445a.129.129 0 0 1-.152.205Z'
        stroke={color}
      />
    </Svg>
  )
}

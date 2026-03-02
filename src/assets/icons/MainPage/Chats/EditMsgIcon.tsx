import Svg, { Path } from 'react-native-svg'
import { IconWithSize } from '@/shared/utils/globalTypes'

export const EditMsgIcon = ({ size = 12, color = 'white' }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 11 11'
      fill='none'
    >
      <Path
        d='m10.468 2.116-.765.765L8.12 1.297l.765-.765a.11.11 0 0 1 .154 0l1.43 1.43a.11.11 0 0 1 0 .154ZM2.084 10.5H.5V8.916l6.258-6.258 1.584 1.584z'
        stroke={color}
      />
    </Svg>
  )
}

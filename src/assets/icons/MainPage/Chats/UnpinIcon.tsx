import Svg, { Path } from 'react-native-svg'
import { IconWithSize } from '@/shared/utils/globalTypes'

export const UnpinIcon = ({ size = 17, color = "white" }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 17 17'
      fill='none'
    >
      <Path
        d='M15.176 13.156a.89.89 0 0 1-1.26 1.26l-2.467-2.469a.07.07 0 0 0-.12.037l-.544 2.72a1.367 1.367 0 0 1-2.308.7l-2.81-2.812-3.778 3.778a.89.89 0 0 1-1.26-1.259l3.779-3.778-2.812-2.811a1.367 1.367 0 0 1 .698-2.307l2.722-.544a.071.071 0 0 0 .036-.12L2.583 3.08a.89.89 0 1 1 1.26-1.259zM13.32 8.781c.33.33.863.33 1.193 0l.282-.281a.445.445 0 0 1 .63 0 .445.445 0 0 0 .629 0l.315-.315a.89.89 0 0 0 0-1.26L10.073.63a.89.89 0 0 0-1.259 0L8.5.945a.445.445 0 0 0 0 .63.445.445 0 0 1 0 .63l-.282.281a.844.844 0 0 0 0 1.193z'
        fill={color}
      />
    </Svg>
  )
}

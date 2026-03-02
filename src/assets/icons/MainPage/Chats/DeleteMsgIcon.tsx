import Svg, { Path } from 'react-native-svg'
import { IconWithSize } from '@/shared/utils/globalTypes'

export const DeleteMsgIcon = ({ size = 12, color = "#FF3A3A" }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 9 12'
      fill='none'
    >
      <Path
        d='m6.39 1.014.148.153h1.819c.06 0 .143.059.143.166s-.082.167-.143.167H.643C.583 1.5.5 1.441.5 1.333c0-.107.082-.166.143-.166h1.819l.148-.153.456-.474a.14.14 0 0 1 .09-.04h2.688a.14.14 0 0 1 .09.04zM1.93 11.5c-.414 0-.786-.359-.786-.833V4c0-.474.372-.833.786-.833h5.14c.414 0 .786.359.786.833v6.667c0 .474-.372.833-.786.833z'
        stroke={color}
      />
    </Svg>
  )
}

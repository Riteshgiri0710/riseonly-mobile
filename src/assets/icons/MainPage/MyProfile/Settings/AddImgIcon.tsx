import Svg, { Path } from 'react-native-svg'
import { IconWithSize } from '@/shared/utils/globalTypes'

export const AddImgIcon = ({ size = 30, color = "white" }: IconWithSize) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 39 39'
      fill='none'
    >
      <Path
        d='M19.5 0A19.74 19.74 0 0 0 0 19.5 19.74 19.74 0 0 0 19.5 39 19.74 19.74 0 0 0 39 19.5 19.74 19.74 0 0 0 19.5 0m11.143 19.5c0 .77-.624 1.393-1.393 1.393h-8.357v8.357a1.393 1.393 0 1 1-2.786 0v-8.357H9.75a1.393 1.393 0 0 1 0-2.786h8.357V9.75a1.393 1.393 0 0 1 2.786 0v8.357h8.357c.77 0 1.393.624 1.393 1.393'
        fill={color}
      />
    </Svg>
  )
}

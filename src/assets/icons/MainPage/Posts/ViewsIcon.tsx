import Svg, { Path } from 'react-native-svg'
import { IconWithWidthAndHeight } from '@/shared/utils/globalTypes'

export const ViewsIcon = ({ width = 23, height = 16, color = 'white' }: IconWithWidthAndHeight) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox='0 0 23 16'
      fill='none'
    >
      <Path
        d='M11.5 4.8c-.832 0-1.63.337-2.218.937A3.23 3.23 0 0 0 8.364 8c0 .849.33 1.663.918 2.263s1.386.937 2.218.937 1.63-.337 2.218-.937.918-1.414.918-2.263-.33-1.663-.918-2.263A3.1 3.1 0 0 0 11.5 4.8m0 8.533a5.18 5.18 0 0 1-3.696-1.562A5.4 5.4 0 0 1 6.273 8c0-1.414.55-2.771 1.53-3.771.981-1 2.31-1.562 3.697-1.562 1.386 0 2.716.562 3.696 1.562S16.727 6.586 16.727 8s-.55 2.771-1.53 3.771a5.18 5.18 0 0 1-3.697 1.562M11.5 0C6.273 0 1.809 3.317 0 8c1.809 4.683 6.273 8 11.5 8s9.691-3.317 11.5-8c-1.809-4.683-6.273-8-11.5-8'
        fill={color}
      />
    </Svg>
  )
}

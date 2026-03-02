import Svg, { Path } from 'react-native-svg'
import { IconOnlyWithSize } from '@/shared/utils/globalTypes'

export const SafIcon = ({ size = 22 }: IconOnlyWithSize) => {
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
        d='M10.296 4a7 7 0 0 0-3.749 1.552l.224.223a.704.704 0 0 1-.994.996l-.224-.224A7 7 0 0 0 4 10.296h.317a.703.703 0 1 1 0 1.406H4a7.034 7.034 0 0 0 6.296 6.296v-.317a.703.703 0 1 1 1.407 0v.317a7 7 0 0 0 3.75-1.553l-.225-.223a.704.704 0 1 1 .995-.996l.224.225A7 7 0 0 0 18 11.7h-.318a.703.703 0 0 1 0-1.406H18A7.034 7.034 0 0 0 11.703 4v.317a.703.703 0 1 1-1.407 0zm3.845 3.372L10.137 9.92a.7.7 0 0 0-.216.216L7.373 14.14c-.202.317.168.688.485.486l4.005-2.549a.7.7 0 0 0 .215-.215l2.548-4.004c.202-.318-.168-.688-.485-.486'
        fill='#fff'
      />
    </Svg>
  )
}

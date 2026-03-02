import Svg, { Rect } from "react-native-svg"

export const SeanseSettingsIcon = ({ size = 28 }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 28 28'
      fill='none'
    >
      <Rect width={size} height={size} rx={8} fill='#00C781' />
    </Svg>
  )
}

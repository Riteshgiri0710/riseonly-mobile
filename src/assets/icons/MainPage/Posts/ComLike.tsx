import Svg, { Path } from "react-native-svg"

export const ComLike = ({ size = 14, color = "#B7B7B7" }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 14 14'
      fill='none'
    >
      <Path
        d='m8.214 4.806-.113.594h4.626c.189 0 .38.082.53.246.151.166.243.4.243.654v1.4c0 .119-.02.228-.058.337l-1.919 4.928-.002.004c-.127.336-.41.531-.703.531H5.091a.72.72 0 0 1-.53-.246.97.97 0 0 1-.243-.654v-7a.97.97 0 0 1 .246-.658l3.819-4.2.302.33h.001a.6.6 0 0 1 .15.405q-.001.076-.011.133zM2.045 6.1v7.4H.5V6.1z'
        stroke={color}
      />
    </Svg>
  )
}

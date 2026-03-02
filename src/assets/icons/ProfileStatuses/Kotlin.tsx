import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg"

export const KotlinIcon = ({ size = 20 }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 72 72'
      fill='none'
    >
      <Path
        d='M0 0v72h72v-.12l-17.871-18-17.872-18.02 17.872-18.03L71.84 0z'
        fill='url(#a)'
      />
      <Path
        d='M36.818 0 0 36.818V72h.319l36.02-36.02-.08-.08L54.13 17.87 71.84 0z'
        fill='url(#b)'
      />
      <Defs>
        <LinearGradient
          id='a'
          x1={-0.803}
          y1={72.709}
          x2={72.076}
          y2={-0.983}
          gradientUnits='userSpaceOnUse'
        >
          <Stop />
          <Stop offset={1} />
        </LinearGradient>
        <LinearGradient
          id='b'
          x1={-9.761}
          y1={61.228}
          x2={64.79}
          y2={-6.469}
          gradientUnits='userSpaceOnUse'
        >
          <Stop />
          <Stop offset={1} />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}

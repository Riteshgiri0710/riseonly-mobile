import { ReactNode, useEffect, useState } from 'react'
import { ViewStyle } from 'react-native'
import { Box } from '../BoxUi/Box'
import { SecondaryText } from '../SecondaryText/SecondaryText'

export const TimerUi = ({ date, prefix, style }: TimerUiProps) => {
   const [time, setTime] = useState<RemainingTime>({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
   });

   useEffect(() => {
      const intervalId = setInterval(() => {
         const diff = date.getTime() - new Date().getTime();

         if (diff > 0) {
            setTime({
               days: Math.floor(diff / (1000 * 60 * 60 * 24)),
               hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
               minutes: Math.floor((diff / 1000 / 60) % 60),
               seconds: Math.floor((diff / 1000) % 60),
            })
         } else clearInterval(intervalId);
      }, 1000)
   }, [])

	return (
		<Box fD='row' gap={10}>
			{prefix && <SecondaryText>{prefix}</SecondaryText>}
         <SecondaryText>
            {time.days}:{time.hours}:{time.minutes}:{time.seconds}
         </SecondaryText>
		</Box>
	)
}

interface TimerUiProps {
   date: Date
   prefix?: string | ReactNode
   style?: ViewStyle
}

interface RemainingTime {
   days: number;
   hours: number;
   minutes: number;
   seconds: number;
}
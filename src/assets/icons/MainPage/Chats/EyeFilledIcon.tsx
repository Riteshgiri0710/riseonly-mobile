import React, { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

type IconProps = {
	size?: number;
	bgColor?: string;
	color?: string;
};

export const EyeFilledIcon = memo(
	({
		size = 28,
		bgColor = '#FFA200',
		color = '#FFFFFF',
	}: IconProps) => {
		return (
			<Svg
				width={size}
				height={size}
				viewBox="0 0 28 28"
				fill="none"
			>
				<Rect
					width={28}
					height={28}
					rx={8}
					fill={bgColor}
				/>

				<Path
					d="M6.05 14.2486C5.98333 14.0882 5.98333 13.9118 6.05 13.7514C6.69933 12.3455 7.80153 11.1433 9.21686 10.2975C10.6322 9.45157 12.2969 9 14 9C15.7031 9 17.3678 9.45157 18.7831 10.2975C20.1985 11.1433 21.3007 12.3455 21.95 13.7514C22.0167 13.9118 22.0167 14.0882 21.95 14.2486C21.3007 15.6545 20.1985 16.8567 18.7831 17.7025C17.3678 18.5484 15.7031 19 14 19C12.2969 19 10.6322 18.5484 9.21686 17.7025C7.80153 16.8567 6.69933 15.6545 6.05 14.2486Z"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>

				<Path
					d="M14 16.1431C15.3254 16.1431 16.3999 15.1836 16.3999 14C16.3999 12.8164 15.3254 11.857 14 11.857C12.6746 11.857 11.6001 12.8164 11.6001 14C11.6001 15.1836 12.6746 16.1431 14 16.1431Z"
					stroke={color}
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
		);
	}
);

EyeFilledIcon.displayName = 'EyeFilledIcon';

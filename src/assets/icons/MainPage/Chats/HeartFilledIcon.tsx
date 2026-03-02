import React, { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

type IconProps = {
	size?: number;
	bgColor?: string;
	color?: string;
	strokeWidth?: number;
};

export const HeartFilledIcon = memo(
	({
		size = 28,
		bgColor = '#FF3131',
		color = '#FFFFFF',
		strokeWidth = 2,
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
					d="M7 11.8901C7.00001 11.1054 7.23631 10.339 7.67769 9.69241C8.11907 9.04578 8.74476 8.54924 9.47212 8.26838C10.1995 7.98751 10.9943 7.93554 11.7516 8.11932C12.5089 8.3031 13.193 8.71399 13.7137 9.29772C13.7503 9.33723 13.7947 9.36872 13.8439 9.39025C13.8932 9.41178 13.9463 9.42289 14 9.42289C14.0537 9.42289 14.1068 9.41178 14.156 9.39025C14.2053 9.36872 14.2496 9.33723 14.2863 9.29772C14.8053 8.7102 15.4896 8.29586 16.2481 8.10984C17.0066 7.92383 17.8034 7.97496 18.5324 8.25645C19.2613 8.53793 19.8879 9.0364 20.3287 9.68553C20.7695 10.3347 21.0037 11.1036 21 11.8901C21 13.5051 19.95 14.711 18.9 15.7689L15.0556 19.5157C14.9251 19.6667 14.7643 19.7879 14.5838 19.8714C14.4033 19.9549 14.2072 19.9987 14.0086 20C13.81 20.0012 13.6133 19.9599 13.4318 19.8787C13.2502 19.7976 13.0879 19.6784 12.9556 19.5291L9.09999 15.7689C8.05 14.711 7 13.5121 7 11.8901Z"
					stroke={color}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
		);
	}
);

HeartFilledIcon.displayName = 'HeartIcon';

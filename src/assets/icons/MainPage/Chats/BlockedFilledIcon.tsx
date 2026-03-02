import React, { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

type IconProps = {
	size?: number;
	bgColor?: string;
	color?: string;
};

export const BlockedFilledIcon = memo(
	({
		size = 28,
		bgColor = '#FF3131',
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
					d="M14 6.5C18.1239 6.5 21.5 9.87614 21.5 14C21.5 18.1239 18.1239 21.5 14 21.5C9.87614 21.5 6.5 18.1239 6.5 14C6.5 9.87614 9.87614 6.5 14 6.5ZM8.57812 9.75684C7.61464 10.8955 7.09961 12.3732 7.09961 14C7.09961 17.7961 10.2039 20.9004 14 20.9004C15.6268 20.9004 17.1045 20.3854 18.2432 19.4219L18.6582 19.0703L18.2734 18.6865L9.31348 9.72656L8.92969 9.3418L8.57812 9.75684ZM14 7.09961C12.3732 7.09961 10.8955 7.61464 9.75684 8.57812L9.3418 8.92969L9.72656 9.31348L19.1035 18.6904L19.4473 18.2109C20.2912 17.0295 20.9004 15.5696 20.9004 14C20.9004 10.2039 17.7961 7.09961 14 7.09961Z"
					fill={color}
					stroke={color}
				/>
			</Svg>
		);
	}
);

BlockedFilledIcon.displayName = 'BlockedFilledIcon';

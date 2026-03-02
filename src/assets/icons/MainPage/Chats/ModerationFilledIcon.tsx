import React, { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

type IconProps = {
	size?: number;
	bgColor?: string;
	color?: string;
};

export const ModerationFilledIcon = memo(
	({
		size = 28,
		bgColor = '#08A500',
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
					fill={color}
					d="M6.7304 13.5713C6.9888 12.4707 7.232 11.4385 6 9.72093L8.8 6.74419C8.8 6.74419 11.6 7.86047 14 6C16.4 7.86047 19.2 6.74419 19.2 6.74419L22 9.72093C20.7688 11.4385 21.0112 12.4707 21.2696 13.5713C21.5144 14.6162 21.7736 15.722 20.8 17.5349C19.8744 19.2577 18.2784 19.859 16.788 20.4201C15.7032 20.8294 14.6744 21.2164 14 22C13.3264 21.2164 12.2968 20.8287 11.212 20.4201C9.7216 19.859 8.1264 19.2577 7.2 17.5349C6.2256 15.7228 6.4856 14.6162 6.7304 13.5713ZM15.9024 14.3892L17.804 12.6642L15.1752 12.3085L14 10.093L12.824 12.3085L10.196 12.6642L12.0976 14.3892L11.6488 16.8242L14 15.6744L16.3512 16.8242L15.9024 14.3892Z"
				/>
			</Svg>
		);
	}
);

ModerationFilledIcon.displayName = 'ModerationFilledIcon';

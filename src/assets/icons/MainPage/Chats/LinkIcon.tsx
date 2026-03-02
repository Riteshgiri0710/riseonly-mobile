import React, { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

type IconProps = {
	size?: number;
	bgColor?: string;
	color?: string;
	strokeWidth?: number;
};

export const LinkIcon = memo(
	({
		size = 28,
		bgColor = '#008DE5',
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
					d="M12.9915 15.255C13.3154 15.6885 13.7286 16.0472 14.2032 16.3067C14.6778 16.5663 15.2026 16.7206 15.742 16.7593C16.2814 16.7979 16.8228 16.72 17.3295 16.5308C17.8361 16.3416 18.2962 16.0456 18.6786 15.6627L20.9413 13.3977C21.6283 12.6857 22.0084 11.7321 21.9998 10.7423C21.9912 9.75247 21.5946 8.80563 20.8954 8.1057C20.1962 7.40577 19.2503 7.00874 18.2615 7.00014C17.2726 6.99154 16.32 7.37205 15.6087 8.05971L14.3114 9.35079"
					stroke={color}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>

				<Path
					d="M16.0085 13.745C15.6846 13.3115 15.2713 12.9528 14.7968 12.6933C14.3222 12.4337 13.7974 12.2794 13.258 12.2407C12.7186 12.2021 12.1772 12.28 11.6705 12.4692C11.1638 12.6584 10.7037 12.9544 10.3214 13.3373L8.05865 15.6023C7.37167 16.3143 6.99155 17.2679 7.00014 18.2577C7.00874 19.2475 7.40536 20.1944 8.10459 20.8943C8.80381 21.5942 9.7497 21.9912 10.7385 21.9999C11.7273 22.0085 12.68 21.6279 13.3913 20.9403L14.681 19.6492"
					stroke={color}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
		);
	}
);

LinkIcon.displayName = 'LinkIcon';

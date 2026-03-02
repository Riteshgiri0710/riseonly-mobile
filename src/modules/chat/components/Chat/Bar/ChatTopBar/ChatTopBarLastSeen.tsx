import { chatLastSeenDate } from '@lib/date';
import { SecondaryText } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

interface ChatTopBarLastSeenProps {
	timestamp: number;
	isOnline?: boolean;
	updateInterval?: number;
}

export const ChatTopBarLastSeen = observer(({
	timestamp,
	isOnline = false,
	updateInterval = 1000
}: ChatTopBarLastSeenProps) => {
	const [lastSeenText, setLastSeenText] = useState(() => chatLastSeenDate(timestamp, isOnline));

	useEffect(() => {
		setLastSeenText(chatLastSeenDate(timestamp, isOnline));

		const interval = setInterval(() => {
			setLastSeenText(chatLastSeenDate(timestamp, isOnline));
		}, updateInterval);

		return () => clearInterval(interval);
	}, [timestamp, isOnline, updateInterval]);

	return (
		<SecondaryText px={12}>
			{lastSeenText}
		</SecondaryText>
	);
});

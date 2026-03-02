import { useEffect, useState } from 'react';
import { scheduleReveal } from './deferredMessageContent';

export function useDeferredContent(): boolean {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		scheduleReveal(() => {
			setReady(true);
		});
	}, []);

	return ready;
}

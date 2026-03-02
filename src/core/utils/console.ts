/**
 * Console that only outputs in __DEV__. Same typings/params as console.log/warn/error.
 * Use this instead of global console.* so production builds don't leak logs.
 */
export const console = {
	log: (...data: any[]): void => {
		if (!__DEV__) return;
		console.log(...data);
	},
	warn: (...data: any[]): void => {
		if (!__DEV__) return;
		console.warn(...data);
	},
	error: (...data: any[]): void => {
		if (!__DEV__) return;
		console.error(...data);
	},
};

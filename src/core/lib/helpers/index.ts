import { showNotify } from '@core/config/const';
import { LoggerTypes } from '@core/config/types';
import { makeAutoObservable, runInAction } from 'mobx';
import { generateNumericId } from '../numbers';
import { formatDiffData } from '../text';

/**
 * Validates data and throws if invalid.
 * Shows detailed information about the type of problem.
 *
 * @param data - Data to validate (any type)
 * @param message - Error message
 * @throws Error if data is invalid
 *
 * @example
 * checker(profile, "getProfile: profile is not loaded");
 * checker(postId, "deletePost: postId is required");
 * checker(scrollRef?.current, "getItems: scrollRef is not ready");
 */
export function checker<T>(data: T, message: string, throwError: boolean = false): asserts data is NonNullable<T> {
	if (data === null || data === undefined) {
		logger.error("Checker", `${message} (value is ${data === null ? 'null' : 'undefined'})`);
		showNotify("error", { title: "Checker", message });
		if (throwError) throw new Error(`[Checker] ${message}`);
	}

	if (typeof data === "number" && Number.isNaN(data)) {
		logger.warning("Checker", `${message} (value is NaN)`);
		showNotify("warning", { title: "Checker", message: `${message} (value is NaN)` });
		if (throwError) throw new Error(`[Checker] ${message} (value is NaN)`);
	}

	if (data === false) {
		logger.warning("Checker", `${message} (value is false)`);
		showNotify("warning", { title: "Checker", message: `${message} (value is false)` });
		if (throwError) throw new Error(`[Checker] ${message} (value is false)`);
	}

	if (Array.isArray(data) && data.length === 0) {
		logger.warning("Checker", `${message} (array is empty)`);
		showNotify("warning", { title: "Checker", message: `${message} (array is empty)` });
		if (throwError) throw new Error(`[Checker] ${message} (array is empty)`);
	}

	if (typeof data === "string" && data.trim() === "") {
		logger.warning("Checker", `${message} (string is empty)`);
		showNotify("warning", { title: "Checker", message: `${message} (string is empty)` });
		if (throwError) throw new Error(`[Checker] ${message} (string is empty)`);
	}
}

class Logger {
	constructor() {
		makeAutoObservable(this);
	}

	logs: any[] = [];
	private pendingLogs: any[] = [];
	private timeoutId: ReturnType<typeof setTimeout> | null = null;

	addLog = (log: any) => {
		this.pendingLogs.push(log);

		if (!this.timeoutId) {
			this.timeoutId = setTimeout(() => {
				runInAction(() => {
					this.logs.push(...this.pendingLogs);
					this.pendingLogs = [];
					this.timeoutId = null;
				});
			}, 0);
		}
	};

	clearLogs = () => {
		this.logs = [];
		this.pendingLogs = [];
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	};
}

export const storeLogger = new Logger();

const colors = {
	error: "\x1b[31m", // red
	warning: "\x1b[33m", // yellow
	info: "\x1b[32m", // green
	system: "\x1b[34m", // blue
	success: "\x1b[32m", // green
	debug: "\x1b[35m", // black
	component: "\x1b[36m", // cyan
	page: "\x1b[33m", // orange
	ui: "\x1b[35m" // purple
};

const styleColors = {
	error: "#ff0000",
	warning: "#ffa500",
	info: "#00ff00",
	system: "#0000ff",
	success: "#00ff00",
	debug: "#0000ff",
	component: "#00ffff",
	page: "#ff00ff",
	ui: "#800080"
};

export const getLogColor = (type: LoggerTypes) => {
	return styleColors[type];
};

export const getMessage = (message: any) => {
	return typeof message === "string" ? message : formatDiffData(message);
};

const shouldLog = () => typeof __DEV__ !== 'undefined' && __DEV__;

export const logger = {
	info: (name: string = "Logger", message: any) => {
		const log = `${colors.info}[${name}]: ${getMessage(message)}\x1b[0m`;
		if (shouldLog()) console.log(log);
		storeLogger.addLog({ id: generateNumericId(), name, message: getMessage(message), type: "info", timestamp: Date.now(), log });
	},
	error: (name: string = "Logger", message: any) => {
		const log = `${colors.error}[${name}]: ${getMessage(message)}\x1b[0m`;
		if (shouldLog()) console.log(log);
		storeLogger.addLog({ id: generateNumericId(), name, message: getMessage(message), type: "error", timestamp: Date.now(), log });
	},
	warning: (name: string = "Logger", message: any) => {
		const log = `${colors.warning}[${name}]: ${getMessage(message)}\x1b[0m`;
		if (shouldLog()) console.log(log);
		storeLogger.addLog({ id: generateNumericId(), name, message: getMessage(message), type: "warning", timestamp: Date.now(), log });
	},
	warn: (name: string = "Logger", message: any) => {
		const log = `${colors.warning}[${name}]: ${getMessage(message)}\x1b[0m`;
		if (shouldLog()) console.log(log);
		storeLogger.addLog({ id: generateNumericId(), name, message: getMessage(message), type: "warning", timestamp: Date.now(), log });
	},
	system: (name: string = "Logger", message: any) => {
		const log = `${colors.system}[${name}]: ${getMessage(message)}\x1b[0m`;
		if (shouldLog()) console.log(log);
		storeLogger.addLog({ id: generateNumericId(), name, message: getMessage(message), type: "system", timestamp: Date.now(), log });
	},
	success: (name: string = "Logger", message: any) => {
		const log = `${colors.success}[${name}]: ${getMessage(message)}\x1b[0m`;
		if (shouldLog()) console.log(log);
		storeLogger.addLog({ id: generateNumericId(), name, message: getMessage(message), type: "success", timestamp: Date.now(), log });
	},
	debug: (name: string = "Logger", message: any) => {
		const log = `${colors.debug}[${name}]: ${getMessage(message)}\x1b[0m`;
		if (shouldLog()) console.log(log);
		storeLogger.addLog({ id: generateNumericId(), name, message: getMessage(message), type: "debug", timestamp: Date.now(), log });
	},
	component: (name: string = "Logger", message: any) => {
		const log = `${colors.component}[${name}]: ${getMessage(message)}\x1b[0m`;
		if (shouldLog()) console.log(log);
		storeLogger.addLog({ id: generateNumericId(), name, message: getMessage(message), type: "component", timestamp: Date.now(), log });
	},
	page: (name: string = "Logger", message: any) => {
		const log = `${colors.page}[${name}]: ${getMessage(message)}\x1b[0m`;
		if (shouldLog()) console.log(log);
		storeLogger.addLog({ id: generateNumericId(), name, message: getMessage(message), type: "page", timestamp: Date.now(), log });
	},
	ui: (name: string = "Logger", message: any) => {
		const log = `${colors.ui}[${name}]: ${getMessage(message)}\x1b[0m`;
		if (shouldLog()) console.log(log);
		storeLogger.addLog({ id: generateNumericId(), name, message: getMessage(message), type: "ui", timestamp: Date.now(), log });
	}
};
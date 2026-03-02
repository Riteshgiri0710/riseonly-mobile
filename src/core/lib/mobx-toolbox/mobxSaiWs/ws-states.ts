import { makeAutoObservable, runInAction } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { formatId } from '../../text';
import { MobxUpdater, NestedKeyOf, UpdateCache, UpdaterT } from '../useMobxUpdate';
import { defaultWsOptions } from './const';
import { ExtractArrayElement, MobxSaiWsOptions } from './types';

export class WebsocketStates<T> {
	constructor(data: T, options?: MobxSaiWsOptions) {
		this.data = data;
		this.options = options || defaultWsOptions;
		makeAutoObservable(this);
	}

	status: "pending" | "fulfilled" | "rejected" = "pending";
	scopeStatus: "pending" | "fulfilled" | "rejected" | "" = "";
	data: T | null = null;
	error: Error | null = null;

	isPending: boolean = false;
	isFulfilled: boolean = false;
	isRejected: boolean = false;

	isScopePending: boolean = false;
	isScopeFulfilled: boolean = false;
	isScopeRejected: boolean = false;

	addedToEndCount = 0;
	addedToStartCount = 0;
	fetchedCount = 0;

	scrollProgress = 0;
	gettedToTop = mobxState(0)('gettedToTop');
	botStatus: "pending" | "fulfilled" | "rejected" | "" = "";
	topStatus: "pending" | "fulfilled" | "rejected" | "" = "";
	scrollCachedData = mobxState<any[]>([])('scrollCachedData');

	isBotPending = false;
	isBotRejected = false;
	isBotFulfilled = false;

	isTopPending = false;
	isTopRejected = false;
	isTopFulfilled = false;

	topError: Error | null = null;
	botError: Error | null = null;

	isHaveMoreBot = mobxState(true)('isHaveMoreBot');
	isHaveMoreTop = mobxState(true)('isHaveMoreTop');

	saiUpdater = <K extends NestedKeyOf<ExtractArrayElement<T> & { id: string | number; }>>(
		id: string | string[] | number | null,
		key: K | null,
		updater: UpdaterT<ExtractArrayElement<T> & { id: string | number; }, K> | ((prev: any[]) => any[]),
		idKey: string = 'id',
		cacheId?: string | string[] | number | null,
		updateCache?: UpdateCache
	): void => {
		if (!cacheId) {
			console.warn('[saiUpdater] cacheId is not defined');
			return;
		}

		if (!this.data) {
			console.warn('[saiUpdater] No data available');
			return;
		}

		const pathToArray = this.options.pathToArray;
		if (!pathToArray) {
			console.warn('[saiUpdater] pathToArray is not defined in options');
			return;
		}

		const arrayData = this.getPathValue(this.data, pathToArray);
		if (!Array.isArray(arrayData)) {
			console.warn('[saiUpdater] Data at pathToArray is not an array');
			return;
		}

		if (id === null || key === null) {
			const updaterFn = updater as (prev: any[]) => any[];
			const newArray = updaterFn(arrayData);
			const safeArray = Array.isArray(newArray) ? newArray : [];

			runInAction(() => {
				arrayData.length = 0;
				arrayData.push(...safeArray);
			});
			return;
		}

		const mobxUpdater = new MobxUpdater();

		mobxUpdater.updateState(
			arrayData,
			formatId(id),
			key,
			updater as any,
			idKey,
			formatId(cacheId),
			updateCache
		);
	};

	setData = (data: T) => {
		this.data = data;
	};

	private getPathValue = (obj: any, path: string): any => {
		return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
	};

	setAddedToEndCount = (which: '+' | '-' | number) => {
		if (typeof which == 'number') this.addedToEndCount = which;
		else if (which == '+') this.addedToEndCount = this.addedToEndCount + 1;
		else this.addedToEndCount = this.addedToEndCount - 1;
	};

	setAddedToStartCount = (which: '+' | '-' | number) => {
		if (typeof which == 'number') this.addedToStartCount = which;
		else if (which == '+') this.addedToStartCount = this.addedToStartCount + 1;
		else this.addedToStartCount = this.addedToStartCount - 1;
	};

	setFetchedCount = (which: '+' | '-' | number) => {
		if (typeof which == 'number') this.fetchedCount = which;
		else if (which == '+') this.fetchedCount = this.fetchedCount + 1;
		else this.fetchedCount = this.fetchedCount - 1;
	};

	setIsPending = () => {
		this.status = "pending";
		this.isPending = true;
		this.isFulfilled = false;
		this.isRejected = false;
	};

	setIsFulfilled = () => {
		this.status = "fulfilled";
		this.isPending = false;
		this.isFulfilled = true;
		this.isRejected = false;
	};

	setIsRejected = () => {
		this.status = "rejected";
		this.isPending = false;
		this.isFulfilled = false;
		this.isRejected = true;
	};

	setScopePending = () => {
		this.scopeStatus = "pending";
		this.isScopePending = true;
		this.isScopeFulfilled = false;
		this.isScopeRejected = false;
	};

	setScopeFulfilled = () => {
		this.scopeStatus = "fulfilled";
		this.isScopePending = false;
		this.isScopeFulfilled = true;
		this.isScopeRejected = false;
	};

	setScopeRejected = () => {
		this.scopeStatus = "rejected";
		this.isScopePending = false;
		this.isScopeFulfilled = false;
		this.isScopeRejected = true;
	};

	value = () => this.data;
	errorMessage = () => this.error?.message || null;

	options: MobxSaiWsOptions = defaultWsOptions;

	fetch = (message: any) => this;
	setScrollRef = (scrollRef: any) => this;
}
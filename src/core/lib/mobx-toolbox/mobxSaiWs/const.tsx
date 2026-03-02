import { MobxSaiWsOptions } from './types';

export const defaultWsOptions: MobxSaiWsOptions = {
	mockMode: false,
	fetchIfPending: false,
	fetchIfHaveData: true,
	fetchIfHaveLocalStorage: true,
	takeCachePriority: 'localCache',
	storageCache: false,
	isSetData: true,
	needPending: true,
	needStates: true,
	bypassQueue: true,
	maxCacheData: 100,
	maxLocalStorageCache: 100,
	cacheSystem: {},
	dataScope: {
		startFrom: 'top',
		topPercentage: null,
		botPercentage: null,
		relativeParamsKey: null,
		relativeIdSelectStrategy: 'default',
		upStrategy: 'default',
		upOrDownParamsKey: null,
		isHaveMoreResKey: null,
		howMuchGettedToTop: 0,
		setParams: null,
		class: null
	},
	fetchAddTo: {}
};
import { findByKey } from '../obj';

/**
 * Extends Object prototype with findByKey. Recursively finds value by key (including nested).
 */
declare global {
	interface Object {
		/**
		 * Recursively finds value by key in object (including nested)
		 * 
		 * @param key - ключ для поиска
		 * @returns найденное значение или undefined, если ключ не найден
		 * 
		 * @example
		 * const user1 = { is_online: true };
		 * const user2 = { more: { is_online: true } };
		 * user1.findByKey('is_online'); // true
		 * user2.findByKey('is_online'); // true
		 * user2.findByKey('last_seen'); // undefined или значение, если найдено
		 */
		findByKey(key: string): any;
	}
}

if (!Object.prototype.findByKey) {
	Object.defineProperty(Object.prototype, 'findByKey', {
		value: function (key: string): any {
			return findByKey(this, key);
		},
		enumerable: false,
		configurable: true,
		writable: true,
	});
}

export { };

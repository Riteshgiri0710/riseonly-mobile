/**
 * Gets value from object by path
 * @param obj - объект из которого извлекаем данные
 * @param path - путь в формате "key1.key2.key3"
 * @returns извлеченные данные или весь объект если путь не указан
 */
export function extractDataByPath(obj: any, path?: string): any {
	if (!path || !obj) {
		return obj;
	}

	const keys = path.split('.');
	let result = obj;

	for (const key of keys) {
		if (result && typeof result === 'object' && key in result) {
			result = result?.[key] || null;
		} else {
			console.warn(`[extractDataByPath] Путь "${path}" не найден в объекте, возвращаем исходный объект`);
			return obj;
		}
	}

	console.log(`[extractDataByPath] ✅ Извлечены данные по пути "${path}"`, {
		extractedKeys: typeof result === 'object' ? Object.keys(result).slice(0, 5) : 'не объект'
	});

	return result;
}

export function findArrayKeysDeep(obj: any, result = {} as any) {
	if (obj && typeof obj === "object") {
		for (const [key, value] of Object.entries(obj)) {
			if (Array.isArray(value)) {
				result[key] = { length: value.length };
			}

			if (value && typeof value === "object") {
				findArrayKeysDeep(value, result);
			}
		}
	}

	return result;
}

export function isEqual(a: any, b: any): boolean {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (typeof a !== typeof b) return false;

	if (typeof a === 'object') {
		if (Array.isArray(a)) {
			if (!Array.isArray(b) || a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (!isEqual(a[i], b[i])) return false;
			}
			return true;
		} else {
			const keysA = Object.keys(a);
			const keysB = Object.keys(b);
			if (keysA.length !== keysB.length) return false;
			for (const key of keysA) {
				if (!(key in b) || !isEqual(a[key], b[key])) return false;
			}
			return true;
		}
	}

	return false;
}

/**
 * Recursively finds value by key in object (including nested)
 * @param obj - объект для поиска
 * @param key - ключ для поиска
 * @param visited - множество уже посещенных объектов (для предотвращения циклических ссылок)
 * @returns найденное значение или undefined, если ключ не найден
 * 
 * @example
 * const user1 = { is_online: true };
 * const user2 = { more: { is_online: true } };
 * findByKey(user1, 'is_online'); // true
 * findByKey(user2, 'is_online'); // true
 */
export function findByKey(obj: any, key: string, visited: WeakSet<object> = new WeakSet()): any {
	if (obj == null || typeof obj !== 'object') {
		return undefined;
	}

	if (visited.has(obj)) {
		return undefined;
	}
	visited.add(obj);

	if (key in obj) {
		return obj[key];
	}

	for (const value of Object.values(obj)) {
		if (value != null && typeof value === 'object') {
			const result = findByKey(value, key, visited);
			if (result !== undefined) {
				return result;
			}
		}
	}

	return undefined;
}

/**
 * Extends Array with insert. Inserts element at index.
 */
declare global {
	interface Array<T> {
		/**
		 * Inserts element at index
		 * 
		 * @param index - индекс, куда вставить элемент
		 * @param value - значение для вставки
		 * @returns новый массив с вставленным элементом (иммутабельный подход)
		 */
		insert(index: number, value: T): T[];

		/**
		 * Replaces element at index
		 * 
		 * @param index - индекс элемента, который нужно заменить
		 * @param value - новое значение для замены
		 * @returns новый массив с заменённым элементом (иммутабельный подход)
		 */
		replaceAt(index: number, value: T): T[];

		/**
		 * Appends array elements to this array (mutates)
		 * 
		 * @param array - массив для добавления
		 * @param index - индекс, ПОСЛЕ которого вставить элементы (по умолчанию - конец массива)
		 */
		add(array: T[], index?: number): void;
	}
}

if (!Array.prototype.add) {
	Array.prototype.add = function <T>(array: T[], index?: number): void {
		if (index !== undefined) {
			if (index < 0 || index >= this.length) {
				throw new Error('Index out of bounds');
			}

			this.splice(index + 1, 0, ...array);
		} else {
			this.push(...array);
		}
	};
}

if (!Array.prototype.replaceAt) {
	Array.prototype.replaceAt = function <T>(index: number, value: T): T[] {
		if (index < 0 || index >= this.length) {
			throw new Error('Index out of bounds');
		}

		return [
			...this.slice(0, index),
			value,
			...this.slice(index + 1)
		];
	};
}

if (!Array.prototype.insert) {
	Array.prototype.insert = function <T>(index: number, value: T): T[] {
		if (index < 0 || index > this.length) {
			throw new Error('Index out of bounds');
		}

		return [
			...this.slice(0, index),
			value,
			...this.slice(index)
		];
	};
}

export { };


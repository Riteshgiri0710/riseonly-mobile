import React from 'react';

import MenuItem from './MenuItem';

import { MenuItemProps } from './types';

const MenuItems = ({ items }: { items: MenuItemProps[]; }) => {
	if (!items || items.length === 0) {
		console.warn('[MenuItems] No items provided!');
		return null;
	}

	return (
		<>
			{items.map((item: MenuItemProps, index: number) => {
				if (!item || !item.text) {
					return null;
				}
				return (
					<MenuItem
						key={`${item.text}-${index}`}
						item={item}
						isLast={items.length === index + 1}
					/>
				);
			})}
		</>
	);
};

export default MenuItems;


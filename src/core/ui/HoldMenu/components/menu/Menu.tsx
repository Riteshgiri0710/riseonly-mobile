import React from 'react';
import MenuList from './MenuList';

const MenuComponent = () => {
	return <MenuList />;
};

const Menu = React.memo(MenuComponent);

export default Menu;


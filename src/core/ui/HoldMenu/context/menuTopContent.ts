import React from 'react';

export type MenuTopContentContextType = {
	menuTopContent: React.ReactNode | null;
	setMenuTopContent: (node: React.ReactNode | null) => void;
};

// @ts-ignore
export const MenuTopContentContext = React.createContext<MenuTopContentContextType>(null);

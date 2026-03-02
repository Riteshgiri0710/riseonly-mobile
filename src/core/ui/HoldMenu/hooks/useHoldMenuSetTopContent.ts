import { useContext } from 'react';
import { MenuTopContentContext } from '../context/menuTopContent';

/**
 * Sets content above context menu items (e.g. reactions). Renders inside menu. Call on screen mount, clear on unmount.
 */
export function useHoldMenuSetTopContent(): (node: React.ReactNode | null) => void {
	const { setMenuTopContent } = useContext(MenuTopContentContext);
	return setMenuTopContent;
}

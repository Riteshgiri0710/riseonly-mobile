import { useCallback } from 'react';
import { CONTEXT_MENU_STATE } from '../constants';
import { useInternal } from './useInternal';

export function useHoldMenuClose(): () => void {
	const { state } = useInternal();

	return useCallback(() => {
		state.value = CONTEXT_MENU_STATE.END;
	}, [state]);
}

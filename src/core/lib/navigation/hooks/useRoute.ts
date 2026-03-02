import type { RootStackParamList } from '@app/router';
import { useRoute as useRNRoute } from '@react-navigation/native';
import type { RouteProp } from '../types';

export function useRoute<RouteName extends keyof RootStackParamList>(): RouteProp<RootStackParamList, RouteName> {
	return useRNRoute<RouteProp<RootStackParamList, RouteName>>();
}


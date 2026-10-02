import { useSyncExternalStore } from 'react';
import { getSyncStatus, subscribeSyncStatus } from '../services/syncService';

export const useSyncStatus = () => useSyncExternalStore(subscribeSyncStatus, getSyncStatus);

import { Capacitor } from '@capacitor/core';

export const isNativeMobile = () => Capacitor.isNativePlatform(); // true on 'android' and 'ios'
export const getMobilePlatform = () => Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isIOS = () => Capacitor.getPlatform() === 'ios';

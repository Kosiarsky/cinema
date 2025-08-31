import { InjectionToken } from '@angular/core';

export const API_BASE_URL_TOKEN = new InjectionToken<string>('API_BASE_URL');
export const FRONTEND_BASE_URL_TOKEN = new InjectionToken<string>('FRONTEND_BASE_URL');
export const SSR_AUTH_HEADER_TOKEN = new InjectionToken<string | null>('SSR_AUTH_HEADER');

// Content links (banners, notices) → Expo Router hrefs.
import type { Href } from 'expo-router';

import type { AppLink } from '@/data/types';

const TAB_HREF = { home: '/', live: '/live', schedule: '/schedule', vod: '/vod', my: '/my' } as const;

export function linkHref(link: AppLink): Href {
  switch (link.name) {
    case 'tab':
      return TAB_HREF[link.tab];
    case 'live':
      return { pathname: '/live/[id]', params: { id: link.id } };
    case 'vod':
      return { pathname: '/vod/[id]', params: { id: link.id } };
    case 'series':
      return { pathname: '/tournaments/[id]', params: { id: link.id } };
    case 'paywall':
      return '/paywall';
  }
}

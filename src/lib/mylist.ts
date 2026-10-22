// My List (web demo v2 features/library/listActions.tsx): saving events, broadcast days, classics and hands.
// Separate from reminders on purpose. Guests sign in first; the save completes when they're back.
import { useApp, type ListKind, type MenuAction } from '@/state/app';

export function useMyList() {
  const { state, set, toast, signedIn, requireLogin } = useApp();
  const has = (kind: ListKind, id: string) => state.myList.some((x) => x.kind === kind && x.id === id);
  const add = (kind: ListKind, id: string) => {
    set((s) => ({ myList: s.myList.some((x) => x.kind === kind && x.id === id) ? s.myList : [{ kind, id, addedAt: Date.now() }, ...s.myList] }));
    toast('Added to My List');
  };
  const toggle = (kind: ListKind, id: string) => {
    if (!signedIn) return requireLogin('Sign in to save this to My List. We’ll add it as soon as you’re back.', () => add(kind, id));
    if (!has(kind, id)) return add(kind, id);
    set((s) => ({ myList: s.myList.filter((x) => !(x.kind === kind && x.id === id)) }));
    toast('Removed from My List');
  };
  return { has, toggle, items: state.myList };
}

/** The standard My List action for a card's ⋯ menu. */
export function useListAction(kind: ListKind, id: string): MenuAction {
  const list = useMyList();
  const on = list.has(kind, id);
  return { label: on ? 'Remove from My List' : 'Add to My List', icon: on ? 'close' : 'plus', onSelect: () => list.toggle(kind, id) };
}

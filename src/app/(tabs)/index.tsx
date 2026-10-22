// Home (web demo v2 pages/Home.tsx). Section order and visibility come from the home config (remote, else built-in).
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, View } from 'react-native';

import { Billboard } from '@/components/Billboard';
import { ArchiveCard, BroadcastCard, CardStack, Grid, HandCard, ListItemCard, PlayerTile, UpcomingCard } from '@/components/cards';
import { HomeChannelCard } from '@/components/channel';
import { AppHeader, Footer } from '@/components/headers';
import { IconButton, SectionHeader } from '@/components/ui';
import { channels } from '@/data/channels';
import { audienceIncludes, type HomeSection } from '@/data/home';
import { archive, dayById, events, hands, players } from '@/data/mock';
import { COMPLETE_THRESHOLD } from '@/data/policy';
import { memberTier, useApp, useTick } from '@/state/app';
import { colors } from '@/theme';

export default function Home() {
  const { state, home, refreshHome } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const tier = memberTier(state);
  const layout = home.config.layouts[state.mode].filter((s) => s.visible && audienceIncludes(s.audience, state.scenario, tier));

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHome();
    setRefreshing(false);
  };

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={layout}
      keyExtractor={(s, i) => `${s.type}-${i}`}
      renderItem={({ item }) => <HomeSectionView section={item} />}
      ListHeaderComponent={
        // Pull-to-refresh doesn't exist in a desktop browser, so the web preview gets a refresh button instead.
        <AppHeader right={Platform.OS === 'web' ? <IconButton name="refresh" label="Refresh home" onPress={onRefresh} /> : undefined} />
      }
      ListFooterComponent={<Footer />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} colors={[colors.gold]} progressBackgroundColor={colors.surface2} />}
      initialNumToRender={3}
      windowSize={7}
    />
  );
}

function HomeSectionView({ section }: { section: HomeSection }) {
  switch (section.type) {
    case 'billboard':
      return <Billboard />;
    case 'channels':
      return <ChannelsRow title={section.title} />;
    case 'continueWatching':
      return <ContinueRow title={section.title} />;
    case 'myList':
      return <MyListRow title={section.title} />;
    case 'comingUp':
      return <ComingUp title={section.title} />;
    case 'freeHighlights':
      return <FreeHighlights title={section.title} />;
    case 'followedPlayers':
      return <FollowedHands title={section.title} />;
    case 'featuredPlayers':
      return <FeaturedPlayers title={section.title} />;
    case 'archive':
      return <Classics title={section.title} />;
  }
}

function Section({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

function ChannelsRow({ title }: { title?: string }) {
  const now = useTick(30_000);
  return (
    <Section>
      <SectionHeader title={title ?? 'On the channels now'} kicker="24/7 channels" action="Channel guide" onAction={() => router.push({ pathname: '/live', params: { tab: 'channels' } })} />
      <CardStack>
        {channels.map((ch) => (
          <HomeChannelCard key={ch.id} ch={ch} now={now} />
        ))}
      </CardStack>
    </Section>
  );
}

function ContinueRow({ title }: { title?: string }) {
  const { state, set, toast, signedIn } = useApp();
  if (!signedIn) return null;
  const items = Object.entries(state.progress)
    .map(([id, sec]) => ({ ref: dayById(id)!, sec }))
    .filter((x) => x.ref)
    // Watched past the completion threshold → no longer "in progress".
    .filter((x) => x.sec / (x.ref.day.durationMin * 60) < COMPLETE_THRESHOLD);
  if (!items.length) return null;
  const remove = (dayId: string) => {
    const sec = state.progress[dayId];
    set((s) => {
      const next = { ...s.progress };
      delete next[dayId];
      return { progress: next };
    });
    toast('Removed from Continue Watching', { label: 'Undo', onPress: () => set((s) => ({ progress: { ...s.progress, [dayId]: sec } })) });
  };
  return (
    <Section>
      <SectionHeader title={title ?? 'Continue Watching'} />
      <CardStack>
        {items.slice(0, 4).map(({ ref, sec }) => (
          <BroadcastCard
            key={ref.day.id}
            event={ref.event}
            day={ref.day}
            progress={sec / (ref.day.durationMin * 60)}
            extraActions={[{ label: 'Remove from Continue Watching', icon: 'close', onSelect: () => remove(ref.day.id) }]}
          />
        ))}
      </CardStack>
    </Section>
  );
}

/** My List: hidden while empty. */
function MyListRow({ title }: { title?: string }) {
  const { state, signedIn } = useApp();
  if (!signedIn || !state.myList.length) return null;
  return (
    <Section>
      <SectionHeader title={title ?? 'My List'} action="See all" onAction={() => router.push('/my-list')} />
      <CardStack>
        {[...state.myList]
          .sort((a, b) => b.addedAt - a.addedAt)
          .slice(0, 4)
          .map((x) => (
            <ListItemCard key={x.kind + x.id} item={x} />
          ))}
      </CardStack>
    </Section>
  );
}

function ComingUp({ title }: { title?: string }) {
  const { status } = useApp();
  const upcoming = events
    .flatMap((e) => e.days.map((d) => ({ e, d })))
    .filter((x) => status(x.d) === 'upcoming')
    .sort((a, b) => a.d.start.localeCompare(b.d.start))
    // one card per event: its next broadcast day
    .filter((x, i, arr) => arr.findIndex((y) => y.e.id === x.e.id) === i)
    .slice(0, 4);
  return (
    <Section>
      <SectionHeader title={title ?? 'Coming up'} action="Full schedule" onAction={() => router.navigate('/schedule')} />
      <CardStack>
        {upcoming.map(({ e, d }) => (
          <UpcomingCard key={d.id} e={e} d={d} />
        ))}
      </CardStack>
    </Section>
  );
}

function FreeHighlights({ title }: { title?: string }) {
  const free = [...hands].filter((h) => h.access === 'free').sort((a, b) => b.views - a.views);
  return (
    <Section>
      <SectionHeader title={title ?? 'Free highlights'} kicker="No account needed" action="All hands" onAction={() => router.navigate('/hands')} />
      <CardStack>
        {free.slice(0, 4).map((h) => (
          <HandCard key={h.id} hand={h} />
        ))}
      </CardStack>
    </Section>
  );
}

function FollowedHands({ title }: { title?: string }) {
  const { state, signedIn } = useApp();
  const followed = Object.keys(state.followed);
  const list = hands.filter((h) => h.playerIds.some((p) => followed.includes(p))).slice(0, 4);
  if (!signedIn || !list.length) return null;
  return (
    <Section>
      <SectionHeader title={title ?? 'From players you follow'} action="Players" onAction={() => router.push('/players')} />
      <CardStack>
        {list.map((h) => (
          <HandCard key={h.id} hand={h} />
        ))}
      </CardStack>
    </Section>
  );
}

function FeaturedPlayers({ title }: { title?: string }) {
  const featured = [...players].sort((a, b) => b.poyPoints - a.poyPoints).slice(0, 10);
  return (
    <Section>
      <SectionHeader title={title ?? 'Featured players'} action="All players" onAction={() => router.push('/players')} />
      <Grid cols={3}>
        {featured.map((p) => (
          <PlayerTile key={p.id} player={p} />
        ))}
      </Grid>
    </Section>
  );
}

function Classics({ title }: { title?: string }) {
  return (
    <Section>
      <SectionHeader title={title ?? 'Relive the finals'} action="Archive" onAction={() => router.push('/archive')} />
      <CardStack>
        {archive.map((a) => (
          <ArchiveCard key={a.id} item={a} />
        ))}
      </CardStack>
    </Section>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 40 },
});

import { useEffect, useState } from 'react';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { StatusBar } from 'expo-status-bar';
import {
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const weekdayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const buildWeek = () => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      day: weekdayNames[date.getDay()],
      date: date.getDate(),
      fullDate: date,
      hasEvent: [1, 3, 5].includes(date.getDay()),
    };
  });
};

const days = buildWeek();

const dailyTrack = {
  title: 'Daily Sample',
  artist: 'SoundHelix',
  url:
    process.env.EXPO_PUBLIC_DAILY_SONG_URL ??
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
};

type Provider = {
  name: string;
  url: string;
};

type ActivityResponse = {
  activity: string;
  tag: string;
};

type RecommendationResponse = {
  tag: string;
  query: string;
  providers: Provider[];
};

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

const fallbackProviders = (tag: string): Provider[] => {
  const queryByTag: Record<string, string> = {
    Coding: 'focus instrumental coding music',
    Workout: 'high energy workout music',
    Meeting: 'calm professional focus music',
    Relax: 'calming ambient relaxation music',
    Other: 'music discovery mix',
  };
  const query = queryByTag[tag] ?? queryByTag.Other;
  const encoded = encodeURIComponent(query);

  return [
    { name: 'YouTube Music', url: `https://music.youtube.com/search?q=${encoded}` },
    { name: 'Spotify', url: `https://open.spotify.com/search/${encoded}` },
    { name: 'Apple Music', url: `https://music.apple.com/us/search?term=${encoded}` },
  ];
};

export default function App() {
  const player = useAudioPlayer(dailyTrack.url, { downloadFirst: true });
  const playerStatus = useAudioPlayerStatus(player);
  const [activity, setActivity] = useState<ActivityResponse>({
    activity: 'Free Time',
    tag: 'Relax',
  });
  const [recommendationQuery, setRecommendationQuery] =
    useState('calming ambient relaxation music');
  const [recommendationProviders, setRecommendationProviders] =
    useState<Provider[]>(fallbackProviders('Relax'));
  const [selectedDate, setSelectedDate] = useState(
    days.find((item) => item.fullDate.toDateString() === new Date().toDateString())?.date ??
      new Date().getDate(),
  );
  const [activeTab, setActiveTab] = useState<'Today' | 'Calendar' | 'Music'>('Today');

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldPlayInBackground: true,
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`${apiUrl}/api/current-activity`)
      .then((response) => {
        if (!response.ok) throw new Error('Activity unavailable');
        return response.json() as Promise<ActivityResponse>;
      })
      .then(async (activityResponse) => {
        if (cancelled) return;

        setActivity(activityResponse);
        const recommendationResponse = await fetch(
          `${apiUrl}/api/recommendations?tag=${encodeURIComponent(activityResponse.tag)}`,
        ).then((response) => {
          if (!response.ok) throw new Error('Recommendations unavailable');
          return response.json() as Promise<RecommendationResponse>;
        });

        if (cancelled) return;
        setRecommendationQuery(recommendationResponse.query);
        setRecommendationProviders(recommendationResponse.providers);
      })
      .catch(() => {
        if (cancelled) return;
        setActivity({ activity: 'Free Time', tag: 'Relax' });
        setRecommendationQuery('calming ambient relaxation music');
        setRecommendationProviders(fallbackProviders('Relax'));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDailyTrack = () => {
    if (playerStatus.playing) {
      player.pause();
    } else {
      if (playerStatus.didJustFinish) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const selectedDay = days.find((item) => item.date === selectedDate) ?? days[0];
  const selectedAgendaDate = selectedDay.fullDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const selectedMonth = selectedDay.fullDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>CSS</Text></View>
          <Text style={styles.brandName}>Calendar Song Sync</Text>
          <Pressable accessibilityRole="button" style={styles.profileButton}>
            <Text style={styles.profileButtonText}>SC</Text>
          </Pressable>
        </View>

        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR PERSONAL RHYTHM</Text>
            <Text style={styles.title}>
              Make time for <Text style={styles.titleAccent}>everything.</Text>
            </Text>
            <Text style={styles.subtitle}>
              A little more intention for every part of your day.
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeIcon}>♫</Text>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.cardHeading}>
            <View>
              <Text style={styles.eyebrow}>YOUR CALENDAR ✦</Text>
              <Text style={styles.month}>{selectedMonth}</Text>
            </View>
            <Pressable accessibilityRole="button" style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Today</Text>
            </Pressable>
          </View>

          <View style={styles.daysRow}>
            {days.map((item) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.day} ${item.date}`}
                key={item.date}
                onPress={() => setSelectedDate(item.date)}
                style={[styles.day, item.date === selectedDate && styles.selectedDay]}
              >
                <Text style={styles.dayName}>{item.day}</Text>
                <Text
                  style={[
                    styles.dayNumber,
                    item.date === selectedDate && styles.selectedDayNumber,
                  ]}
                >
                  {item.date}
                </Text>
                <View
                  style={[
                    styles.eventDot,
                    !item.hasEvent && styles.hiddenEventDot,
                  ]}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.liveRow}>
            <Text style={styles.eyebrow}>RIGHT NOW</Text>
            <Text style={styles.live}>LIVE</Text>
          </View>
          <View style={styles.activityHero}>
            <View style={styles.recordShell}>
              <View style={styles.recordInner}>
                <Text style={styles.activityIcon}>♫</Text>
              </View>
            </View>
            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>{activity.activity}</Text>
              <Text style={styles.activitySubtitle}>
                {activity.tag} · Your current activity
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={toggleDailyTrack}
            style={styles.soundtrackButton}
          >
            <Text style={styles.soundtrackButtonText}>▶  Find my soundtrack  ↗</Text>
          </Pressable>
        </View>

        <View style={styles.dailyTrackCard}>
          <View style={styles.dailyTrackCopy}>
            <Text style={styles.eyebrow}>SONG OF THE DAY ✦</Text>
            <Text style={styles.dailyTrackTitle}>{dailyTrack.title}</Text>
            <Text style={styles.dailyTrackArtist}>{dailyTrack.artist}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              playerStatus.playing
                ? 'Pause song of the day'
                : 'Play song of the day'
            }
            onPress={toggleDailyTrack}
            style={styles.playButton}
          >
            <Text style={styles.playButtonText}>
              {playerStatus.playing ? 'Ⅱ' : '▶'}
            </Text>
          </Pressable>
          {playerStatus.isBuffering ? (
            <Text style={styles.bufferingText}>Loading...</Text>
          ) : null}
        </View>

        <View style={styles.recommendationsCard}>
          <Text style={styles.eyebrow}>MEDIA RECOMMENDATIONS ✦</Text>
          <Text style={styles.recommendationsTitle}>
            {recommendationQuery}
          </Text>
          <View style={styles.providerRow}>
            {recommendationProviders.map((provider) => (
              <Pressable
                accessibilityRole="link"
                key={provider.name}
                onPress={() => Linking.openURL(provider.url)}
                style={styles.providerButton}
              >
                <Text style={styles.providerButtonText}>{provider.name} ↗</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.agendaCard}>
          <Text style={styles.eyebrow}>THE LINEUP</Text>
          <Text style={styles.agendaTitle}>Your day</Text>
          <Text style={styles.agendaDate}>{selectedAgendaDate}</Text>
          <Text style={styles.emptyAgenda}>
            Nothing planned here yet. A little room to breathe.
          </Text>
        </View>

        <View style={styles.bottomNav}>
          {(['Today', 'Calendar', 'Music'] as const).map((tab) => (
            <Pressable
              accessibilityRole="button"
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.navItem, activeTab === tab && styles.activeNavItem]}
            >
              <Text
                style={[
                  styles.navItemText,
                  activeTab === tab && styles.activeNavItemText,
                ]}
              >
                {tab === 'Today' ? '◉' : tab === 'Calendar' ? '▦' : '♫'}
              </Text>
              <Text
                style={[
                  styles.navLabel,
                  activeTab === tab && styles.activeNavLabel,
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f1e8',
  },
  container: {
    gap: 18,
    padding: 24,
    paddingBottom: 40,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#526c62',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  brandMarkText: {
    color: '#fffdf8',
    fontSize: 10,
    fontWeight: '900',
  },
  brandName: {
    color: '#23322e',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 10,
  },
  profileButton: {
    alignItems: 'center',
    backgroundColor: '#e7eee4',
    borderColor: '#d8ddd2',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  profileButtonText: {
    color: '#52645b',
    fontSize: 11,
    fontWeight: '800',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  headerCopy: {
    flex: 1,
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: '#e9d7c1',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginLeft: 12,
    transform: [{ rotate: '8deg' }],
    width: 56,
  },
  headerBadgeIcon: {
    color: '#9b6b4d',
    fontSize: 28,
  },
  eyebrow: {
    color: '#72806b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: '#23322e',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    marginTop: 10,
  },
  titleAccent: {
    color: '#9b6b4d',
    fontStyle: 'italic',
  },
  subtitle: {
    color: '#718079',
    fontSize: 15,
    marginTop: 8,
  },
  musicMark: {
    color: '#9b6b4d',
    fontSize: 34,
    marginTop: 6,
  },
  calendarCard: {
    backgroundColor: '#fffdf8',
    borderRadius: 24,
    padding: 20,
  },
  cardHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  month: {
    color: '#23322e',
    fontSize: 23,
    fontWeight: '700',
    marginTop: 6,
  },
  todayButton: {
    borderColor: '#d8ddd2',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  todayButtonText: {
    color: '#52645b',
    fontSize: 13,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  day: {
    alignItems: 'center',
    borderRadius: 16,
    minWidth: 38,
    paddingVertical: 9,
  },
  selectedDay: {
    backgroundColor: '#526c62',
  },
  dayName: {
    color: '#8a968e',
    fontSize: 9,
    fontWeight: '700',
  },
  dayNumber: {
    color: '#35453f',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  selectedDayNumber: {
    color: '#fffdf8',
  },
  eventDot: {
    backgroundColor: '#d69a72',
    borderRadius: 3,
    height: 6,
    marginTop: 7,
    width: 6,
  },
  hiddenEventDot: {
    opacity: 0,
  },
  activityCard: {
    backgroundColor: '#526c62',
    borderRadius: 24,
    padding: 24,
  },
  liveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  live: {
    color: '#d5e6d2',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  activityHero: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 18,
  },
  recordShell: {
    alignItems: 'center',
    backgroundColor: '#40564e',
    borderColor: '#d7bd9a',
    borderRadius: 46,
    borderWidth: 4,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  recordInner: {
    alignItems: 'center',
    backgroundColor: '#e5c4a4',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  activityIcon: {
    color: '#526c62',
    fontSize: 26,
  },
  activityCopy: {
    flex: 1,
    marginLeft: 16,
  },
  activityTitle: {
    color: '#fffdf8',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  activitySubtitle: {
    color: '#d5e0d7',
    fontSize: 14,
    marginTop: 6,
  },
  soundtrackButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5c4a4',
    borderRadius: 14,
    marginTop: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  soundtrackButtonText: {
    color: '#35453f',
    fontSize: 13,
    fontWeight: '700',
  },
  dailyTrackCard: {
    alignItems: 'center',
    backgroundColor: '#e9d7c1',
    borderRadius: 24,
    flexDirection: 'row',
    padding: 20,
  },
  dailyTrackCopy: {
    flex: 1,
  },
  dailyTrackTitle: {
    color: '#23322e',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 6,
  },
  dailyTrackArtist: {
    color: '#6f6258',
    fontSize: 14,
    marginTop: 4,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: '#526c62',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  playButtonText: {
    color: '#fffdf8',
    fontSize: 22,
    fontWeight: '700',
  },
  bufferingText: {
    bottom: 8,
    color: '#6f6258',
    fontSize: 10,
    position: 'absolute',
    right: 86,
  },
  recommendationsCard: {
    backgroundColor: '#fffdf8',
    borderRadius: 24,
    padding: 20,
  },
  recommendationsTitle: {
    color: '#23322e',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 6,
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  providerButton: {
    backgroundColor: '#edf1e8',
    borderColor: '#d8ddd2',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  providerButtonText: {
    color: '#52645b',
    fontSize: 12,
    fontWeight: '700',
  },
  agendaCard: {
    backgroundColor: '#e7eee4',
    borderRadius: 24,
    padding: 24,
  },
  agendaTitle: {
    color: '#23322e',
    fontSize: 25,
    fontWeight: '700',
    marginTop: 6,
  },
  agendaDate: {
    color: '#66766e',
    fontSize: 14,
    marginTop: 8,
  },
  emptyAgenda: {
    color: '#66766e',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 26,
  },
  bottomNav: {
    alignSelf: 'center',
    backgroundColor: '#23322e',
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: '#526c62',
  },
  navItemText: {
    color: '#9fb0a7',
    fontSize: 17,
  },
  activeNavItemText: {
    color: '#fffdf8',
  },
  navLabel: {
    color: '#9fb0a7',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
  },
  activeNavLabel: {
    color: '#fffdf8',
  },
});

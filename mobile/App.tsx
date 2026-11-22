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
  Animated,
  Easing,
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
  title: 'Outfoxing',
  artist: 'Daily Demo Track',
  url:
    process.env.EXPO_PUBLIC_DAILY_SONG_URL ??
    'https://mdn.github.io/webaudio-examples/audio-basics/outfoxing.mp3',
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
  const auroraFloat = useState(() => new Animated.Value(0))[0];
  const auroraSpin = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.loop(
      Animated.timing(auroraFloat, {
        toValue: 1,
        duration: 9000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: false,
      }),
    ).start();

    Animated.loop(
      Animated.timing(auroraSpin, {
        toValue: 1,
        duration: 24000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ).start();
  }, [auroraFloat, auroraSpin]);

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
      <View style={styles.liveBackground} pointerEvents="none">
        <Animated.View
          style={[
            styles.auroraOrb,
            styles.auroraPurple,
            {
              transform: [
                {
                  translateY: auroraFloat.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [-18, 28, -18],
                  }),
                },
                {
                  translateX: auroraFloat.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 34],
                  }),
                },
                {
                  rotate: auroraSpin.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.auroraOrb,
            styles.auroraOrange,
            {
              transform: [
                {
                  translateY: auroraFloat.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [24, -24, 24],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.auroraOrb,
            styles.auroraGreen,
            {
              transform: [
                {
                  scale: auroraFloat.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.92, 1.12, 0.92],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
      <ScrollView contentContainerStyle={styles.container} style={styles.scrollView}>
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
    backgroundColor: '#b9e4de',
    overflow: 'hidden',
  },
  liveBackground: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  auroraOrb: {
    borderRadius: 240,
    position: 'absolute',
  },
  auroraPurple: {
    backgroundColor: '#8a62ff',
    height: 330,
    left: -170,
    opacity: 0.78,
    top: 50,
    width: 330,
  },
  auroraOrange: {
    backgroundColor: '#ff8e72',
    bottom: 180,
    height: 280,
    opacity: 0.72,
    right: -150,
    width: 280,
  },
  auroraGreen: {
    backgroundColor: '#55d6ae',
    bottom: -130,
    height: 360,
    left: -90,
    opacity: 0.88,
    width: 360,
  },
  scrollView: {
    zIndex: 2,
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
    backgroundColor: '#173f52',
    borderColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    boxShadow: '0 12px 24px rgba(20, 92, 102, 0.28)',
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
    backgroundColor: 'rgba(255, 253, 248, 0.84)',
    borderColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderRadius: 24,
    boxShadow: '0 18px 42px rgba(39, 96, 101, 0.18)',
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
    backgroundColor: '#173f52',
    boxShadow: '0 10px 22px rgba(23, 63, 82, 0.32)',
    transform: [{ translateY: -3 }],
    shadowColor: '#173f52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
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
    backgroundColor: 'rgba(24, 70, 94, 0.92)',
    borderColor: 'rgba(161, 240, 220, 0.48)',
    borderWidth: 1,
    borderRadius: 24,
    boxShadow: '0 22px 48px rgba(20, 74, 88, 0.34)',
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
    backgroundColor: '#203b62',
    borderColor: '#ffc4b0',
    borderRadius: 46,
    borderWidth: 4,
    height: 92,
    justifyContent: 'center',
    boxShadow: '0 16px 30px rgba(255, 175, 139, 0.34)',
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
    backgroundColor: 'rgba(255, 205, 171, 0.88)',
    borderColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderRadius: 24,
    boxShadow: '0 18px 38px rgba(146, 91, 137, 0.18)',
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
    backgroundColor: 'rgba(255, 253, 248, 0.82)',
    borderColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderRadius: 24,
    boxShadow: '0 18px 38px rgba(73, 95, 131, 0.16)',
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
    backgroundColor: 'rgba(225, 241, 227, 0.82)',
    borderColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderRadius: 24,
    boxShadow: '0 18px 38px rgba(65, 131, 116, 0.16)',
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

import { useEffect } from 'react';
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

const days = [
  { day: 'MON', date: '10', hasEvent: true },
  { day: 'TUE', date: '11', hasEvent: false },
  { day: 'WED', date: '12', hasEvent: true },
  { day: 'THU', date: '13', hasEvent: false },
  { day: 'FRI', date: '14', hasEvent: true },
  { day: 'SAT', date: '15', hasEvent: false },
  { day: 'SUN', date: '16', hasEvent: true },
];

const dailyTrack = {
  title: 'Daily Sample',
  artist: 'SoundHelix',
  url:
    process.env.EXPO_PUBLIC_DAILY_SONG_URL ??
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
};

const mediaProviders = [
  {
    name: 'YouTube Music',
    url: 'https://music.youtube.com/search?q=calming%20ambient%20relaxation%20music',
  },
  {
    name: 'Spotify',
    url: 'https://open.spotify.com/search/calming%20ambient%20relaxation%20music',
  },
  {
    name: 'Apple Music',
    url: 'https://music.apple.com/us/search?term=calming%20ambient%20relaxation%20music',
  },
];

export default function App() {
  const player = useAudioPlayer(dailyTrack.url, { downloadFirst: true });
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldPlayInBackground: true,
    }).catch(() => undefined);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR PERSONAL RHYTHM</Text>
            <Text style={styles.title}>
              Make time for <Text style={styles.titleAccent}>everything.</Text>
            </Text>
            <Text style={styles.subtitle}>
              A little more intention for every part of your day.
            </Text>
          </View>
          <Text style={styles.musicMark}>♫</Text>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.cardHeading}>
            <View>
              <Text style={styles.eyebrow}>YOUR CALENDAR ✦</Text>
              <Text style={styles.month}>November 2026</Text>
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
                style={[styles.day, item.date === '14' && styles.selectedDay]}
              >
                <Text style={styles.dayName}>{item.day}</Text>
                <Text
                  style={[
                    styles.dayNumber,
                    item.date === '14' && styles.selectedDayNumber,
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
          <Text style={styles.activityIcon}>♫</Text>
          <Text style={styles.activityTitle}>Free Time</Text>
          <Text style={styles.activitySubtitle}>Relax · Your current activity</Text>
          <Pressable accessibilityRole="button" style={styles.soundtrackButton}>
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
          <Text style={styles.recommendationsTitle}>Relax soundtrack</Text>
          <View style={styles.providerRow}>
            {mediaProviders.map((provider) => (
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
          <Text style={styles.agendaDate}>Saturday, November 14</Text>
          <Text style={styles.emptyAgenda}>
            Nothing planned here yet. A little room to breathe.
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
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
  activityIcon: {
    color: '#e5c4a4',
    fontSize: 40,
    marginTop: 20,
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
});

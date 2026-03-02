import { Audio, AVPlaybackSource } from 'expo-av';

let isAudioConfigured = false;

const configureAudio = async () => {
	if (isAudioConfigured) return;

	try {
		await Audio.setAudioModeAsync({
			playsInSilentModeIOS: true,
			staysActiveInBackground: false,
			shouldDuckAndroid: true,
		});
		isAudioConfigured = true;
	} catch (error) {
		console.warn('Error configuring audio:', error);
	}
};

export const playSound = async (source: AVPlaybackSource) => {
	try {
		await configureAudio();

		const { sound } = await Audio.Sound.createAsync(source, {
			shouldPlay: true,
			volume: 1.0,
		});

		sound.setOnPlaybackStatusUpdate((status) => {
			if (status.isLoaded && status.didJustFinish) {
				sound.unloadAsync();
			}
		});
	} catch (error) {
		console.warn('Error playing sound:', error);
	}
};

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Photo } from '../types/photo';

interface VideoPlayerProps {
  video: Photo;
  onClose: () => void;
  visible: boolean;
}

/**
 * VideoPlayer component for displaying videos
 * Currently shows a placeholder as react-native-video is not installed
 * When react-native-video is available, this component can be updated
 * to provide full video playback with play/pause, progress bar, and fullscreen
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose, visible }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * Format video duration from seconds to MM:SS format
   */
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPress = () => {
    // Placeholder - would toggle video playback when react-native-video is available
    setIsPlaying(!isPlaying);
  };

  return (
    <Modal
      animationType="fade"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeIcon}>X</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {video.filename}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Video Content */}
        <View style={styles.videoContainer}>
          {/* Thumbnail with overlay */}
          <Image
            source={{ uri: video.thumbnailUri || video.uri }}
            style={styles.thumbnail}
            resizeMode="contain"
          />

          {/* Placeholder overlay */}
          <View style={styles.placeholderOverlay}>
            <View style={styles.playButtonLarge}>
              <Text style={styles.playIconLarge}>▶</Text>
            </View>
            <Text style={styles.comingSoonText}>Video playback coming soon</Text>
            <Text style={styles.durationInfo}>
              Duration: {formatDuration(video.duration)}
            </Text>
          </View>
        </View>

        {/* Controls (placeholder) */}
        <View style={styles.controls}>
          {/* Progress bar placeholder */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressFillZero} />
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>0:00</Text>
              <Text style={styles.timeText}>{formatDuration(video.duration)}</Text>
            </View>
          </View>

          {/* Control buttons */}
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePlayPress}
              activeOpacity={0.7}
            >
              <Text style={styles.controlIcon}>{isPlaying ? '||' : '▶'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Text style={styles.controlIcon}>[ ]</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: width,
    height: width * 0.75,
    backgroundColor: '#1A1A1A',
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playButtonLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  playIconLarge: {
    color: '#FFFFFF',
    fontSize: 32,
    marginLeft: 6,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  durationInfo: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  controls: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
  },
  progressFillZero: {
    height: '100%',
    width: 0,
    backgroundColor: '#4A90E2',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VideoPlayer;

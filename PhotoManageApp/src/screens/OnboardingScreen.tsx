import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

const slides = [
  { id: '1', icon: '📸', title: 'Manage Your Photos', description: 'Import and organize your RAW and JPEG photos in one place.' },
  { id: '2', icon: '🔍', title: 'Smart Pairing', description: 'Automatically pairs RAW and JPEG versions of the same shot.' },
  { id: '3', icon: '📁', title: 'Create Albums', description: 'Organize photos into custom albums for easy access.' },
  { id: '4', icon: '☁️', title: 'Sync to NAS', description: 'Back up your photos to your personal NAS storage.' },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={styles.slide}>
      <Text style={styles.icon}>{item.icon}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View key={index} style={[styles.dot, index === currentIndex && styles.activeDot]} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextText}>
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  skipButton: { position: 'absolute', top: 60, right: 20, zIndex: 1 },
  skipText: { fontSize: 16, color: '#666' },
  slide: { width, alignItems: 'center', justifyContent: 'center', padding: 40 },
  icon: { fontSize: 80, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 16, textAlign: 'center' },
  description: { fontSize: 18, color: '#666', textAlign: 'center', lineHeight: 26 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0', marginHorizontal: 5 },
  activeDot: { backgroundColor: '#007AFF' },
  nextButton: { backgroundColor: '#007AFF', marginHorizontal: 20, marginBottom: 30, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  nextText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});

export default OnboardingScreen;

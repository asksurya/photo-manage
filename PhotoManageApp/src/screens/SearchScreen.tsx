import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Button,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import PhotoService from '../services/PhotoService';
import SearchService, { SearchFilters } from '../services/SearchService';
import PhotoGrid from '../components/PhotoGrid';
import { Photo } from '../types/photo';

const SearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    performSearch();
  }, [query, favoritesOnly, startDate, endDate, allPhotos]);

  const loadPhotos = async () => {
    setIsLoading(true);
    const photos = await PhotoService.loadPhotos();
    setAllPhotos(photos);
    setIsLoading(false);
  };

  const performSearch = () => {
    const filters: SearchFilters = {
      query: query.trim(),
      favoritesOnly,
      startDate,
      endDate,
    };
    const results = SearchService.searchPhotos(allPhotos, filters);
    setFilteredPhotos(results);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar & Filters */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by filename, camera..."
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />

        <View style={styles.filtersRow}>
            <TouchableOpacity
                style={[styles.filterChip, favoritesOnly && styles.activeFilterChip]}
                onPress={() => setFavoritesOnly(!favoritesOnly)}
            >
                <Text style={[styles.filterChipText, favoritesOnly && styles.activeFilterChipText]}>
                    {favoritesOnly ? '❤️ Favorites' : '🤍 Favorites'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.filterChip, !!startDate && styles.activeFilterChip]}
                onPress={() => setOpenStart(true)}
            >
                <Text style={[styles.filterChipText, !!startDate && styles.activeFilterChipText]}>
                    {startDate ? `Start: ${startDate.toLocaleDateString()}` : '📅 Start Date'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.filterChip, !!endDate && styles.activeFilterChip]}
                onPress={() => setOpenEnd(true)}
            >
                <Text style={[styles.filterChipText, !!endDate && styles.activeFilterChipText]}>
                    {endDate ? `End: ${endDate.toLocaleDateString()}` : '📅 End Date'}
                </Text>
            </TouchableOpacity>

            {(startDate || endDate) && (
                <TouchableOpacity
                    style={styles.clearChip}
                    onPress={() => { setStartDate(undefined); setEndDate(undefined); }}
                >
                    <Text style={styles.clearChipText}>Clear Dates</Text>
                </TouchableOpacity>
            )}
        </View>
      </View>

      <DatePicker
        modal
        mode="date"
        open={openStart}
        date={startDate || new Date()}
        onConfirm={(date) => {
          setOpenStart(false);
          setStartDate(date);
        }}
        onCancel={() => {
          setOpenStart(false);
        }}
      />

      <DatePicker
        modal
        mode="date"
        open={openEnd}
        date={endDate || new Date()}
        onConfirm={(date) => {
          setOpenEnd(false);
          setEndDate(date);
        }}
        onCancel={() => {
          setOpenEnd(false);
        }}
      />

      {/* Results */}
      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsCount}>
            {filteredPhotos.length} result{filteredPhotos.length !== 1 ? 's' : ''}
        </Text>
        <PhotoGrid photos={filteredPhotos} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#4A90E2',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90E2',
  },
  filterChipText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  clearChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    justifyContent: 'center',
  },
  clearChipText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#6C757D',
    fontSize: 14,
  },
});

export default SearchScreen;

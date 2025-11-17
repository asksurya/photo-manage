import React from 'react';
import { View, Text, Image, FlatList, ScrollView, StyleSheet } from 'react-native';
import { CategoryGroup, CategoryType } from '../types/photo';

interface CategoryGroupListProps {
  categoryGroups: CategoryGroup[];
  categoryType: CategoryType;
}

const CategoryGroupList: React.FC<CategoryGroupListProps> = ({ categoryGroups, categoryType }) => {
  const renderCategoryGroup = ({ item }: { item: CategoryGroup }) => (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryLabel}>{item.title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{item.photos.length}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {item.photos.map((photo) => (
          <View key={photo.id} style={styles.categoryPhotoItem}>
            <Image source={{ uri: photo.uri }} style={styles.categoryPhotoThumb} />
            <Text style={styles.categoryPhotoName} numberOfLines={1}>
              {photo.filename}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {categoryType.charAt(0).toUpperCase() + categoryType.slice(1)} View
        </Text>
      </View>
      <FlatList
        data={categoryGroups}
        renderItem={renderCategoryGroup}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  categorySection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  countBadge: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
  },
  categoryPhotoItem: {
    width: 100,
    marginRight: 12,
  },
  categoryPhotoThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  categoryPhotoName: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
});

export default CategoryGroupList;

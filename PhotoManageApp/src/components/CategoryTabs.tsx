import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { CategoryType } from '../types/photo';

interface CategoryTabsProps {
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ selectedCategory, onSelectCategory }) => (
  <View style={styles.tabsContainer}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsScroll}
    >
      <TouchableOpacity
        style={[styles.tab, selectedCategory === CategoryType.DATE && styles.activeTab]}
        onPress={() => onSelectCategory(CategoryType.DATE)}
      >
        <Text style={[styles.tabIcon, selectedCategory === CategoryType.DATE && styles.activeTabIcon]}>
          📅
        </Text>
        <Text style={[styles.tabText, selectedCategory === CategoryType.DATE && styles.activeTabText]}>
          By Date
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedCategory === CategoryType.LOCATION && styles.activeTab]}
        onPress={() => onSelectCategory(CategoryType.LOCATION)}
      >
        <Text style={[styles.tabIcon, selectedCategory === CategoryType.LOCATION && styles.activeTabIcon]}>
          📍
        </Text>
        <Text style={[styles.tabText, selectedCategory === CategoryType.LOCATION && styles.activeTabText]}>
          By Location
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedCategory === CategoryType.CONTENT && styles.activeTab]}
        onPress={() => onSelectCategory(CategoryType.CONTENT)}
      >
        <Text style={[styles.tabIcon, selectedCategory === CategoryType.CONTENT && styles.activeTabIcon]}>
          🏷️
        </Text>
        <Text style={[styles.tabText, selectedCategory === CategoryType.CONTENT && styles.activeTabText]}>
          By Content
        </Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6C757D',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CategoryTabs;

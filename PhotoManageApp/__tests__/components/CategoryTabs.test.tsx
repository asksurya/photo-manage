import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryTabs from '../../src/components/CategoryTabs';
import { CategoryType } from '../../src/types/photo';

describe('CategoryTabs', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <CategoryTabs
        selectedCategory={CategoryType.DATE}
        onSelectCategory={() => {}}
      />
    );
    expect(getByText('By Date')).toBeDefined();
    expect(getByText('By Location')).toBeDefined();
    expect(getByText('By Content')).toBeDefined();
  });

  it('calls onSelectCategory when a tab is pressed', () => {
    const onSelectCategory = jest.fn();
    const { getByText } = render(
      <CategoryTabs
        selectedCategory={CategoryType.DATE}
        onSelectCategory={onSelectCategory}
      />
    );
    fireEvent.press(getByText('By Location'));
    expect(onSelectCategory).toHaveBeenCalledWith(CategoryType.LOCATION);
  });
});

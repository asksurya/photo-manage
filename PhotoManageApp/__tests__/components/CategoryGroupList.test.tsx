import React from 'react';
import { render } from '@testing-library/react-native';
import CategoryGroupList from '../../src/components/CategoryGroupList';
import { CategoryType } from '../../src/types/photo';

const mockPhotoPair = {
  id: '1',
  pairingKey: 'test-pair',
  raw: {
    id: '1-raw',
    uri: 'file:///test.raw',
    filename: 'test.raw',
    timestamp: Date.now(),
    width: 100,
    height: 100,
    exif: {},
  },
  jpeg: {
    id: '1-jpeg',
    uri: 'file:///test.jpg',
    filename: 'test.jpg',
    timestamp: Date.now(),
    width: 100,
    height: 100,
    exif: {},
  },
};

describe('CategoryGroupList', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <CategoryGroupList
        categoryGroups={[
          {
            id: '1',
            title: 'Test Category',
            photos: [mockPhotoPair.jpeg],
            pairs: [mockPhotoPair],
            type: CategoryType.DATE,
          },
        ]}
        categoryType={CategoryType.DATE}
      />
    );
    expect(getByText('Date View')).toBeDefined();
    expect(getByText('Test Category')).toBeDefined();
  });
});

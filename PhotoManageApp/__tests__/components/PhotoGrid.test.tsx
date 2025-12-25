import React from 'react';
import { render } from '@testing-library/react-native';
import PhotoGrid from '../../src/components/PhotoGrid';
import { SelectionProvider } from '../../src/contexts/SelectionContext';

const mockPhoto = {
  id: '1-jpeg',
  uri: 'file:///test.jpg',
  filename: 'test.jpg',
  timestamp: Date.now(),
  width: 100,
  height: 100,
  exif: {},
};

describe('PhotoGrid', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <SelectionProvider>
        <PhotoGrid photos={[mockPhoto]} />
      </SelectionProvider>
    );
    expect(getByText('All Photos')).toBeDefined();
    expect(getByText('test.jpg')).toBeDefined();
  });
});

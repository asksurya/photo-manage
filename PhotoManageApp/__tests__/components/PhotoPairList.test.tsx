import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PhotoPairList from '../../src/components/PhotoPairList';

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

describe('PhotoPairList', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <PhotoPairList pairs={[mockPhotoPair]} onPairPress={() => {}} />
    );
    expect(getByText('Photo Pairs')).toBeDefined();
    expect(getByText('test-pair')).toBeDefined();
  });

  it('calls onPairPress when a pair is pressed', () => {
    const onPairPress = jest.fn();
    const { getByText } = render(
      <PhotoPairList pairs={[mockPhotoPair]} onPairPress={onPairPress} />
    );
    fireEvent.press(getByText('test-pair'));
    expect(onPairPress).toHaveBeenCalledWith(mockPhotoPair);
  });
});

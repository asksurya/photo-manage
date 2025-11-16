import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SplitView from '../../src/components/SplitView';

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

describe('SplitView', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <SplitView pair={mockPhotoPair} onBack={() => {}} />
    );
    expect(getByText('Compare Photos')).toBeDefined();
    expect(getByText('test-pair')).toBeDefined();
    expect(getByText('RAW')).toBeDefined();
    expect(getByText('JPEG')).toBeDefined();
  });

  it('calls onBack when the back button is pressed', () => {
    const onBack = jest.fn();
    const { getByText } = render(
      <SplitView pair={mockPhotoPair} onBack={onBack} />
    );
    fireEvent.press(getByText('Gallery'));
    expect(onBack).toHaveBeenCalled();
  });
});

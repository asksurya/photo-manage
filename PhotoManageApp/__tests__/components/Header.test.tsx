import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Header from '../../src/components/Header';

describe('Header', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Header photoCount={10} onImport={() => {}} isLoading={false} />
    );
    expect(getByText('Photo Manage')).toBeDefined();
    expect(getByText('10 photos')).toBeDefined();
  });

  it('calls onImport when the import button is pressed', () => {
    const onImport = jest.fn();
    const { getByText } = render(
      <Header photoCount={10} onImport={onImport} isLoading={false} />
    );
    fireEvent.press(getByText('Import'));
    expect(onImport).toHaveBeenCalled();
  });
});

import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingIndicator from '../../src/components/LoadingIndicator';

describe('LoadingIndicator', () => {
  it('renders correctly', () => {
    const { getByText } = render(<LoadingIndicator />);
    expect(getByText('Processing photos...')).toBeDefined();
  });
});

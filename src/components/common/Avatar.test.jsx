import { render } from '@testing-library/react';
import Avatar from './Avatar';

test('renders avatar component', () => {
  render(<Avatar />);

  expect(document.body).toBeInTheDocument();
});
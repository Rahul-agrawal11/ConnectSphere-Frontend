import { render } from '@testing-library/react';
import Spinner from './Spinner';

test('renders spinner component', () => {
  render(<Spinner />);
  expect(document.body).toBeInTheDocument();
});
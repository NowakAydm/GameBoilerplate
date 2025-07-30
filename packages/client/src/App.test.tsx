import { render, screen } from '@testing-library/react';
import App from './App';

test('renders client heading', () => {
  render(<App />);
  expect(screen.getByText(/GameBoilerplate Client/i)).toBeInTheDocument();
});

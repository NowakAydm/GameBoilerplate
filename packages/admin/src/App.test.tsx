import { render, screen } from '@testing-library/react';
import App from './App';

test('renders admin heading', () => {
  render(<App />);
  expect(screen.getByText(/GameBoilerplate Admin/i)).toBeInTheDocument();
});

import React from 'react';
import type { ExampleSharedType } from '@gameboilerplate/shared';

export default function App() {
  return (
    <div>
      <h1>GameBoilerplate Client</h1>
      <p>Welcome to your monorepo React client!</p>
      {/* Example usage from shared */}
      <pre>{JSON.stringify({ id: 'abc', createdAt: new Date() } as ExampleSharedType)}</pre>
    </div>
  );
}

import React from 'react';
import type { ExampleSharedType } from '@gameboilerplate/shared';

export default function App() {
  return (
    <div>
      <h1>GameBoilerplate Admin</h1>
      <p>Welcome to your monorepo admin dashboard!</p>
      {/* Example usage from shared */}
      <pre>{JSON.stringify({ id: 'admin', createdAt: new Date() } as ExampleSharedType)}</pre>
    </div>
  );
}

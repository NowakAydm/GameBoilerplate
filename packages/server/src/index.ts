import express from 'express';
import type { ExampleSharedType } from '@gameboilerplate/shared';

const app = express();
const port = process.env.PORT || 3001;


app.get('/', (_req, res) => {
  const example: ExampleSharedType = { id: 'server', createdAt: new Date() };
  res.json({ message: 'GameBoilerplate Server is running!', example });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

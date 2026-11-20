import { createApp } from './app.js';

const PORT = Number(process.env.PORT || 8080);
const { app } = createApp();

app.listen(PORT, () => {
  console.log(`Backend CU 28 + Patrón State escuchando en http://localhost:${PORT}`);
});

import "reflect-metadata";

import { createApp } from "./app";
import { initializeDatabase } from "./database/data-source";

const port = Number(process.env.PORT ?? 3001);
const app = createApp();

const startServer = async () => {
  await initializeDatabase();

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer().catch((error: unknown) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

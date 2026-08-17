import { env } from "./config/env.js";
import app from "./app.js";

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${env.port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(
      `Port ${env.port} is already in use. Stop the existing backend process or set a different PORT in .env.`
    );
    process.exit(1);
  }

  throw error;
});


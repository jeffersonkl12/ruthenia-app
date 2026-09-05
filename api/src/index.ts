import { serve } from "@hono/node-server";
import { app, serverConfig } from "./server";

const server = serve(
  { fetch: app.fetch, port: serverConfig.port, hostname: serverConfig.host },
  (info) => {
    console.log(
      `agent-api ouvindo em http://${serverConfig.host}:${info.port}`,
    );
  },
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}

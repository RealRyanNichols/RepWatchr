import { initBotId } from "botid/client/core";

try {
  initBotId({
    protect: [
      {
        path: "/api/races/*/poll",
        method: "POST",
      },
    ],
  });
} catch (error) {
  console.error("RepWatchr response protection could not initialize.", error);
}

const hostname = window.location.hostname;

let selectedModule;

if (hostname === "meu-app-edson-staging.web.app") {
  console.log("🔥 Ambiente: STAGING");
  selectedModule = await import("./firebase.staging.js");
} else if (hostname === "meu-app-edson.web.app") {
  console.log("🔥 Ambiente: PRODUCTION");
  selectedModule = await import("./firebase.production.js");
} else {
  console.log("🔥 Ambiente: LOCAL");
  selectedModule = await import("./firebase.staging.js");
}

export const app = selectedModule.app;
export const auth = selectedModule.auth;
export const db = selectedModule.db;
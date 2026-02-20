// firebase-messaging-sw.js fix: ambiente staging selecionado corretamente via hostname


importScripts("https://www.gstatic.com/firebasejs/10.3.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.3.1/firebase-messaging-compat.js");

const hostname = self.location.hostname;

let firebaseConfig;

if (hostname === "meu-app-edson-staging.web.app") {
  firebaseConfig = {
    apiKey: "AIzaSyD-TRHY5ZKieCJTs-2P0TbPhEav76adK3Y", // STAGING
    authDomain: "meu-app-edson-staging.firebaseapp.com",
    projectId: "meu-app-edson-staging",
    storageBucket: "meu-app-edson-staging.appspot.com",
    messagingSenderId: "345449703927",
    appId: "1:345449703927:web:2cb57412df43b9afc3e6f2"
  };
  console.log("🔥 SW Ambiente: STAGING");
} else {
  firebaseConfig = {
    apiKey: "AIzaSyBh6CIne05dCuO0mu7JX6icZv8l7c2bw_8", // PRODUCTION
    authDomain: "meu-app-edson.firebaseapp.com",
    projectId: "meu-app-edson",
    storageBucket: "meu-app-edson.appspot.com",
    messagingSenderId: "555388653411",
    appId: "1:555388653411:web:e9184f7f5e443174934d56"
  };
  console.log("🔥 SW Ambiente: PRODUCTION");
}

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw] Mensagem recebida:", payload);

  const notificationTitle = payload.notification?.title;
  const notificationOptions = {
    body: payload.notification?.body,
    icon: "/icon.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
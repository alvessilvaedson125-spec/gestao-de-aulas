// firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.3.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.3.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBh6CIne05dCuO0mu7JX6icZv8l7c2bw_8",
  authDomain: "meu-app-edson.firebaseapp.com",
  projectId: "meu-app-edson",
  storageBucket: "meu-app-edson.appspot.com",
  messagingSenderId: "555388653411",
  appId: "1:555388653411:web:e9184f7f5e443174934d56"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  console.log("[firebase-messaging-sw.js] Mensagem recebida em segundo plano:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png" // opcional: ícone da notificação
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
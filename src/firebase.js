import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey:            "AIzaSyCf0cCN3LXzEGFJSfGyxppTihrtsQCp1Q0",
    authDomain:        "kia-extensiones.firebaseapp.com",
    databaseURL:       "https://kia-extensiones-default-rtdb.firebaseio.com",
    projectId:         "kia-extensiones",
    storageBucket:     "kia-extensiones.firebasestorage.app",
    messagingSenderId: "100499699133",
    appId:             "1:100499699133:web:976c572e1451ff1dd5ced4"
};

const app = initializeApp(firebaseConfig);
export const db      = getDatabase(app);
export const storage = getStorage(app);

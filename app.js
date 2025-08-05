// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDEShG5yfmuNogFUX00mDakGUVagvrzDMI",
  authDomain: "thestudypointlibrary-4a241.firebaseapp.com",
  projectId: "thestudypointlibrary-4a241",
  storageBucket: "thestudypointlibrary-4a241.firebasestorage.app",
  messagingSenderId: "238260537947",
  appId: "1:238260537947:web:fdc810b7598e0176958d7e",
  measurementId: "G-KTGG5HESJC"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const storage = firebase.storage();
const db = firebase.firestore();

const loginSection = document.getElementById('login-section');
const uploadSection = document.getElementById('upload-section');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const uploadStatus = document.getElementById('upload-status');
const materialsList = document.getElementById('materials-list');
const searchInput = document.getElementById('search');

auth.onAuthStateChanged(user => {
  if (user) {
    loginSection.style.display = 'none';
    uploadSection.style.display = 'block';
  } else {
    loginSection.style.display = 'block';
    uploadSection.style.display = 'none';
  }
});

loginBtn.addEventListener('click', () => {
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('password').value.trim();
  auth.signInWithEmailAndPassword(email, pass)
    .then(()=> alert('Logged in as admin'))
    .catch(err => alert('Login failed: '+err.message));
});

logoutBtn.addEventListener('click', ()=> auth.signOut());

uploadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  const title = titleInput.value.trim() || (file && file.name);
  const category = categoryInput.value;
  if (!file) return alert('Select a file first');

  const storageRef = storage.ref().child(`materials/${Date.now()}_${file.name}`);
  const uploadTask = storageRef.put(file);

  uploadStatus.innerText = 'Uploading...';
  uploadTask.on('state_changed',
    snapshot => {
      const pct = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100).toFixed(0);
      uploadStatus.innerText = `Uploading ${pct}%`;
    },
    error => uploadStatus.innerText = 'Upload error: ' + error.message,
    async () => {
      const url = await uploadTask.snapshot.ref.getDownloadURL();
      await db.collection('materials').add({
        title, category, url, name: file.name, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      uploadStatus.innerText = 'Upload complete';
      fileInput.value = ''; titleInput.value = '';
      loadMaterials();
    }
  );
});

async function loadMaterials() {
  materialsList.innerHTML = '';
  const snapshot = await db.collection('materials').orderBy('createdAt','desc').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement('li');
    li.innerHTML = `<a href="${data.url}" target="_blank">${escapeHtml(data.title)}</a> <small>${escapeHtml(data.name)} • ${escapeHtml(data.category)}</small>`;
    materialsList.appendChild(li);
  });
}
loadMaterials();

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  Array.from(materialsList.children).forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>'&#'+m.charCodeAt(0)+';'); }

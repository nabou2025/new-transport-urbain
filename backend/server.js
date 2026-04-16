const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Sert le frontend (dossier ../frontend en local, ./frontend en prod)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Routes API
app.use('/api/vehicules', require('./routes/vehicules'));
app.use('/api/chauffeurs', require('./routes/chauffeurs'));
app.use('/api/trajets',    require('./routes/trajets'));
app.use('/api/incidents',  require('./routes/incidents'));
app.use('/api/stats',      require('./routes/stats'));
app.use('/api/chat',       require('./chatbot/ai'));

// Route fallback → sert index.html pour toutes les autres URLs
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ TranspoBot démarré sur le port ${PORT}`);
});

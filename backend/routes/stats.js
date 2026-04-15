const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [[{ total_trajets }]] = await db.query(
      "SELECT COUNT(*) as total_trajets FROM trajets WHERE statut='termine'"
    );
    const [[{ trajets_en_cours }]] = await db.query(
      "SELECT COUNT(*) as trajets_en_cours FROM trajets WHERE statut='en_cours'"
    );
    const [[{ vehicules_actifs }]] = await db.query(
      "SELECT COUNT(*) as vehicules_actifs FROM vehicules WHERE statut='actif'"
    );
    const [[{ incidents_ouverts }]] = await db.query(
      "SELECT COUNT(*) as incidents_ouverts FROM incidents WHERE resolu=0"
    );

    res.json({ total_trajets, trajets_en_cours, vehicules_actifs, incidents_ouverts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

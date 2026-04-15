const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.*, t.date_heure_depart, c.nom, c.prenom
      FROM incidents i
      JOIN trajets t ON i.trajet_id = t.id
      JOIN chauffeurs c ON t.chauffeur_id = c.id
      ORDER BY i.date_incident DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
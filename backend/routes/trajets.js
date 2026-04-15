const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/trajets — tous les trajets avec jointures complètes
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.id, t.statut, t.nb_passagers, t.recette,
        t.date_heure_depart, t.date_heure_arrivee,
        t.chauffeur_id, t.vehicule_id,
        c.nom as chauffeur_nom, c.prenom as chauffeur_prenom,
        v.immatriculation,
        l.nom as ligne, l.code as ligne_code
      FROM trajets t
      JOIN chauffeurs c ON t.chauffeur_id = c.id
      JOIN vehicules v ON t.vehicule_id = v.id
      JOIN lignes l ON t.ligne_id = l.id
      ORDER BY t.date_heure_depart DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trajets/recent — 8 derniers pour le dashboard
router.get('/recent', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.id, t.statut, t.nb_passagers, t.recette,
        t.date_heure_depart, t.date_heure_arrivee,
        c.nom as chauffeur_nom, c.prenom as chauffeur_prenom,
        v.immatriculation,
        l.nom as ligne
      FROM trajets t
      JOIN chauffeurs c ON t.chauffeur_id = c.id
      JOIN vehicules v ON t.vehicule_id = v.id
      JOIN lignes l ON t.ligne_id = l.id
      ORDER BY t.date_heure_depart DESC
      LIMIT 8
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

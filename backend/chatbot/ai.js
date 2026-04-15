require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../db');

const SYSTEM_PROMPT = `Tu es TranspoBot, assistant SQL expert pour transport urbain Sénégal.

BASE DE DONNÉES MySQL :
- vehicules(id, immatriculation, type, capacite, statut, kilometrage, date_acquisition)
  statut: 'actif' | 'maintenance' | 'hors_service'
- chauffeurs(id, nom, prenom, telephone, numero_permis, categorie_permis, disponibilite, vehicule_id, date_embauche)
- lignes(id, code, nom, origine, destination, distance_km, duree_minutes)
- tarifs(id, ligne_id, type_client, prix)
- trajets(id, ligne_id, chauffeur_id, vehicule_id, date_heure_depart, date_heure_arrivee, statut, nb_passagers, recette)
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
- incidents(id, trajet_id, type, description, gravite, date_incident, resolu)
  gravite: 'faible' | 'moyen' | 'grave'

RÈGLES STRICTES :
1. UNIQUEMENT requêtes SELECT
2. JSON valide SANS markdown :
   { "sql": "SELECT ...", "explication": "réponse claire français" }
3. Hors sujet : { "sql": null, "explication": "Je réponds aux questions sur véhicules, chauffeurs, lignes, trajets, incidents." }`;

router.post('/', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question manquante' });

  try {
    console.log('Question:', question);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // ✅ Optimisé Groq gratuit  
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question }
        ],
        temperature: 0
      })
    });

    // ✅ GESTION ERREUR 429 (ton problème quota)
    if (response.status === 429) {
      return res.status(429).json({ 
        error: "Quota API atteint. Réessayer dans 1 min ou vérifiez https://console.groq.com/usage" 
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(500).json({ error: `API Groq: ${errorData.error?.message || response.statusText}` });
    }

    const data = await response.json();
    console.log('Réponse Groq:', JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'Réponse API invalide' });
    }

    const raw = data.choices[0].message.content;
    console.log('Texte brut:', raw);

    // ✅ Nettoyage robuste JSON
    const clean = raw
      .replace(/```(?:json)?|```/g, '')
      .replace(/^\s*[\r\n]/gm, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('JSON invalide:', clean);
      return res.status(500).json({ error: 'Réponse LLM mal formatée' });
    }

    // ✅ Sécurité stricte (cahier des charges)  
    if (!parsed.sql) {
      return res.json({ 
        answer: parsed.explication || "Question non comprise", 
        sql: null, 
        data: [] 
      });
    }

    const sqlUpper = parsed.sql.trim().toUpperCase();
    if (!sqlUpper.startsWith('SELECT')) {
      return res.status(403).json({ error: '⚠️ Requête non autorisée (SELECT uniquement)' });
    }

    // ✅ Exécution SQL sécurisée
    const [rows] = await db.query(parsed.sql);
    console.log('Résultats SQL:', rows.length, 'lignes');

    res.json({
      answer: parsed.explication,
      sql: parsed.sql,
      data: rows,
      count: rows.length
    });

  } catch (err) {
    console.error('Erreur complète:', err);
    res.status(500).json({ 
      error: 'Serveur: ' + err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;
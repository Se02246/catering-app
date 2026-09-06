import express from 'express';
import { pool } from '../db.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const configuredModel = process.env.GEMINI_MODEL;
const DEFAULT_MODELS = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.9-flash',
    'gemini-3.1-pro',
    'gemini-4.0-pro',
    'gemini-4-pro',
    'gemini-4.0-flash',
    'gemini-4-flash'
];
const MODEL_WATERFALL = configuredModel
    ? [configuredModel, ...DEFAULT_MODELS.filter(m => m !== configuredModel)]
    : DEFAULT_MODELS;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

// Helper to generate AI content with fallback
async function generateWithFallback(modelIndex = 0, prompt) {
    if (modelIndex >= MODEL_WATERFALL.length) {
        throw new Error('Tutti i modelli AI configurati hanno esaurito la quota o sono falliti.');
    }

    const currentModelName = MODEL_WATERFALL[modelIndex];
    try {
        console.log(`🤖 Tentativo AI veicoli con modello: ${currentModelName} (Priorità ${modelIndex + 1}/${MODEL_WATERFALL.length})`);
        const model = genAI.getGenerativeModel({
            model: currentModelName,
            tools: [{ googleSearch: {} }]
        });
        const result = await model.generateContent(prompt);
        return result;
    } catch (error) {
        console.warn(`⚠️ Modello ${currentModelName} fallito (${error.message}). Passaggio al modello successivo...`);
        return generateWithFallback(modelIndex + 1, prompt);
    }
}

// 1. GET /api/vehicles - Get all vehicles
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM garage_vehicles ORDER BY is_default DESC, id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching garage vehicles:', err);
        res.status(500).json({ error: 'Errore nel recupero dei veicoli dal garage' });
    }
});

// 2. POST /api/vehicles/ai-analyze - Analyze vehicle name, return clean name and consumption
router.post('/ai-analyze', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Specifica il modello o nome del veicolo da analizzare.' });
    }

    const trimmedPrompt = prompt.trim();

    const aiPrompt = `Analizza questa richiesta di veicolo per il nostro garage di consegne catering: "${trimmedPrompt}"

Devi estrarre ed elaborare con precisione:
1. "name": il nome pulito e canonico del veicolo, RIMUOVENDO colori ed elementi estetici o aggettivi generici (es: se l'utente scrive "fiat panda 2013 nera", il nome pulito DEVE essere "Fiat Panda 2013"; se scrive "furgone ford transit bianco", il nome DEVE essere "Ford Transit").
2. "consumption_km_l": il consumo medio reale di carburante per questo veicolo espresso rigorosamente in kilometri per litro (km/l), con un valore numerico decimale (es: 17.5). Se non trovi il dato esatto, calcola una stima tecnica realistica (valore tipico tra 10.0 e 22.0 km/l).

Restituisci ESCLUSIVAMENTE un oggetto JSON valido nel seguente formato:
{
  "name": "Fiat Panda 2013",
  "consumption_km_l": 17.5
}`;

    let parsedData = null;

    try {
        const aiResult = await generateWithFallback(0, aiPrompt);
        const text = aiResult.response.text();
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
        }
    } catch (err) {
        console.warn('AI analysis fallback warning:', err.message);
    }

    let cleanName = (parsedData?.name && typeof parsedData.name === 'string' && parsedData.name.trim()) 
        ? parsedData.name.trim() 
        : trimmedPrompt.replace(/\b(nera|nero|bianca|bianco|rossa|rosso|blu|azzurra|azzurro|grigia|grigio|argento|verde|gialla|giallo|arancione|marrone|macchina|auto|furgone)\b/gi, '').replace(/\s+/g, ' ').trim() || trimmedPrompt;

    // Capitalize cleanName
    cleanName = cleanName.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ');

    let consumptionKmL = (parsedData?.consumption_km_l && !isNaN(parseFloat(parsedData.consumption_km_l)))
        ? parseFloat(Number(parsedData.consumption_km_l).toFixed(1))
        : null;

    if (!consumptionKmL) {
        const lower = trimmedPrompt.toLowerCase();
        if (lower.includes('van') || lower.includes('transit') || lower.includes('ducato') || lower.includes('daily') || lower.includes('sprinter') || lower.includes('furgon')) {
            consumptionKmL = 12.5;
        } else if (lower.includes('doblò') || lower.includes('doblo') || lower.includes('berlingo') || lower.includes('kangoo') || lower.includes('caddy')) {
            consumptionKmL = 15.5;
        } else if (lower.includes('suv') || lower.includes('sportage') || lower.includes('tucson') || lower.includes('qashqai') || lower.includes('tiguan')) {
            consumptionKmL = 15.0;
        } else if (lower.includes('panda') || lower.includes('500') || lower.includes('punto') || lower.includes('clio') || lower.includes('ypsilon') || lower.includes('fiesta') || lower.includes('polo')) {
            consumptionKmL = 17.5;
        } else {
            consumptionKmL = 16.0;
        }
    }

    res.json({
        success: true,
        name: cleanName,
        consumption_km_l: consumptionKmL,
        image_url: null,
        original_prompt: trimmedPrompt
    });
});

// 3. POST /api/vehicles - Save new vehicle to garage
router.post('/', async (req, res) => {
    const { name, consumption_km_l, image_url, is_default } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Il nome del veicolo è obbligatorio.' });
    }

    const trimmedName = name.trim();
    const consumption = parseFloat(consumption_km_l) || 16.0;
    const isDefaultBool = !!is_default;

    // Fallback image if missing
    const defaultImage = '/consegna.jpeg';
    const finalImageUrl = (image_url && typeof image_url === 'string' && image_url.trim()) ? image_url.trim() : defaultImage;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (isDefaultBool) {
            await client.query('UPDATE garage_vehicles SET is_default = FALSE');
        }

        const insertQuery = `
            INSERT INTO garage_vehicles (name, consumption_km_l, image_url, is_default)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await client.query(insertQuery, [trimmedName, consumption, finalImageUrl, isDefaultBool]);

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating garage vehicle:', err);
        res.status(500).json({ error: 'Errore nel salvataggio del veicolo' });
    } finally {
        client.release();
    }
});

// 4. PUT /api/vehicles/:id/set-default - Set a vehicle as default
router.put('/:id/set-default', async (req, res) => {
    const { id } = req.params;
    const vehicleId = parseInt(id);

    if (isNaN(vehicleId)) {
        return res.status(400).json({ error: 'ID veicolo non valido.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Reset all to false
        await client.query('UPDATE garage_vehicles SET is_default = FALSE');

        // Set this vehicle as default
        const result = await client.query('UPDATE garage_vehicles SET is_default = TRUE WHERE id = $1 RETURNING *', [vehicleId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Veicolo non trovato' });
        }

        await client.query('COMMIT');

        // Return full updated list
        const listResult = await client.query('SELECT * FROM garage_vehicles ORDER BY is_default DESC, id ASC');
        res.json({
            success: true,
            vehicle: result.rows[0],
            vehicles: listResult.rows
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error setting default vehicle:', err);
        res.status(500).json({ error: 'Errore nell\'impostazione del veicolo predefinito' });
    } finally {
        client.release();
    }
});

// 5. DELETE /api/vehicles/:id - Delete vehicle from garage
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const vehicleId = parseInt(id);

    if (isNaN(vehicleId)) {
        return res.status(400).json({ error: 'ID veicolo non valido.' });
    }

    try {
        const result = await pool.query('DELETE FROM garage_vehicles WHERE id = $1 RETURNING *', [vehicleId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Veicolo non trovato' });
        }
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        console.error('Error deleting garage vehicle:', err);
        res.status(500).json({ error: 'Errore nella cancellazione del veicolo' });
    }
});

export default router;

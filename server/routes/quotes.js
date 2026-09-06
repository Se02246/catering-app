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

// Helper endpoint per ispezionare i modelli disponibili per la chiave API attuale
router.get('/ai-models', async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return res.status(400).json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY non configurata' });
        }
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        const generateModels = (data.models || [])
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => ({
                id: m.name.replace('models/', ''),
                displayName: m.displayName,
                description: m.description
            }));
        res.json({
            count: generateModels.length,
            active_waterfall: MODEL_WATERFALL,
            available_models: generateModels
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


async function generateWithFallback(modelIndex, prompt, imageParts = [], validator = null, enableSearch = false) {
    if (modelIndex >= MODEL_WATERFALL.length) {
        throw new Error("Tutti i modelli AI sono momentaneamente non disponibili (Quota esaurita o Errore server).");
    }

    const currentModelName = MODEL_WATERFALL[modelIndex];
    console.log(`🤖 Tentativo AI con modello: ${currentModelName} (Priorità ${modelIndex + 1}/${MODEL_WATERFALL.length})${enableSearch ? ' [🔍 Ricerca Web Google Search Attiva]' : ''}`);

    try {
        const modelConfig = { model: currentModelName };
        if (enableSearch) {
            // Abilita la ricerca web Google Search Grounding in tempo reale
            modelConfig.tools = currentModelName.includes('1.5')
                ? [{ googleSearchRetrieval: {} }]
                : [{ googleSearch: {} }];
        }

        let model;
        let result;
        try {
            model = genAI.getGenerativeModel(modelConfig);
            result = await model.generateContent([prompt, ...imageParts]);
        } catch (toolError) {
            // Se la ricerca web non è supportata dal modello specifico, ritenta con il modello standard
            if (enableSearch) {
                console.warn(`⚠️ Ricerca web non supportata da ${currentModelName} (${toolError.message}). Tentativo standard senza ricerca...`);
                model = genAI.getGenerativeModel({ model: currentModelName });
                result = await model.generateContent([prompt, ...imageParts]);
            } else {
                throw toolError;
            }
        }

        const text = result.response.text();

        // Se è presente un validatore e la risposta non lo soddisfa (es. fuel_price: null), passa al modello successivo!
        if (validator && typeof validator === 'function') {
            const isValid = validator(text);
            if (!isValid) {
                console.warn(`⚠️ Modello ${currentModelName} ha restituito un output non valido o vuoto (${text.trim().substring(0, 100)}). Passaggio al modello successivo...`);
                return generateWithFallback(modelIndex + 1, prompt, imageParts, validator, enableSearch);
            }
        }

        return result;
    } catch (error) {
        const errorMsg = error.message || '';
        if (
            errorMsg.includes('429') ||
            errorMsg.includes('503') ||
            errorMsg.includes('quota') ||
            errorMsg.includes('exhausted') ||
            errorMsg.includes('not found') ||
            errorMsg.includes('not supported') ||
            errorMsg.includes('500')
        ) {
            console.warn(`⚠️ Modello ${currentModelName} fallito (${errorMsg}). Passaggio al modello successivo...`);
            return generateWithFallback(modelIndex + 1, prompt, imageParts, validator, enableSearch);
        }
        console.error(`❌ Errore fatale non recuperabile con ${currentModelName}:`, errorMsg);
        throw error;
    }
}

// Generate 10 AI thoughts/steps for real-time feedback
router.post('/ai-thoughts', async (req, res) => {
    const { prompt } = req.body;
    try {
        const aiPrompt = `
In base a questa richiesta di catering: "${prompt}"
Genera esattamente 10 brevi frasi (massimo 6-7 parole l'una) che descrivano i passaggi mentali e tecnici che stai compiendo.
Le frasi devono mescolare dettagli specifici della richiesta (nomi, tipo evento, numero persone) con passaggi professionali.

ISTRUZIONI PER I 10 PENSIERI:
1. Inizia analizzando l'evento specifico dell'utente.
2. Menziona esplicitamente la consultazione del "catalogo Muse Catering".
3. Se ci sono allergie o preferenze, nomina la fase di filtraggio.
4. Parla di "ottimizzazione delle porzioni" e "riduzione degli sprechi".
5. Inserisci riferimenti alla qualità e alla presentazione Muse.
6. Termina con la preparazione della proposta finale.

Restituisci SOLO un array JSON di 10 stringhe.
Esempio: ["Analizzando la tua festa per Marco...", "Consultando il catalogo Muse Catering...", "Selezionando prodotti adatti a 20 bambini...", "Ottimizzando le quantità per evitare sprechi...", ...]
`;
        const result = await generateWithFallback(0, aiPrompt);
        const responseText = result.response.text();
        let jsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const thoughts = JSON.parse(jsonStr);
        res.json(Array.isArray(thoughts) ? thoughts.slice(0, 10) : []);
    } catch (error) {
        console.error('Error generating AI thoughts:', error);
        res.json([]);
    }
});

// Generate AI quote
router.post('/ai-generate', async (req, res) => {
    const { prompt, source } = req.body;
    const isAdmin = source === 'admin';

    try {
        // Public users should only see visible and non-expired products
        let query = 'SELECT * FROM products';
        if (!isAdmin) {
            query += ' WHERE is_visible = true AND (hide_at IS NULL OR hide_at > NOW())';
        }

        const productsResult = await pool.query(query);
        const productsList = productsResult.rows.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price_per_kg: p.price_per_kg,
            price_per_piece: p.price_per_piece,
            is_sold_by_piece: p.is_sold_by_piece,
            is_gluten_free: p.is_gluten_free,
            is_lactose_free: p.is_lactose_free,
            is_vegetarian: p.is_vegetarian,
            is_vegan: p.is_vegan,
            is_traditional: p.is_traditional,
            servings_per_unit: p.servings_per_unit,
            min_order_quantity: p.min_order_quantity,
            order_increment: p.order_increment
        }));

        const aiPrompt = `
Analizza la seguente richiesta di preventivo per un servizio di catering. 
Ecco la lista dei prodotti disponibili nel nostro database in formato JSON:
${JSON.stringify(productsList)}

Richiesta dell'utente:
"${prompt}"

Estrai le informazioni e restituisci un oggetto JSON con la seguente struttura esatta (e niente altro):
{
  "items": [
    {
      "id": ID del prodotto dal database (intero),
      "quantity": quantità richiesta (numero, es. 2 per 2kg o 2 pezzi. Se l'utente non lo specifica, deduci una quantità adeguata in base al numero di persone o al contesto),
      "is_sold_by_piece": booleano (${!isAdmin ? "DEVE ESSERE ESATTAMENTE UGUALE al valore presente nel database per quel prodotto. NON CAMBIARLO MAI" : "puoi scegliere se vendere il prodotto a pezzi (true) o a kg (false) in base alla richiesta del cliente, purché il prodotto abbia entrambi i prezzi definiti nel DB"}),
      "price_per_piece": prezzo unitario (dal db),
      "price_per_kg": prezzo al kg (dal db),
      "name": "nome prodotto",
      "description": "descrizione",
      "is_gluten_free": booleano,
      "is_lactose_free": booleano,
      "is_vegetarian": booleano,
      "is_vegan": booleano,
      "is_traditional": booleano
    }
  ],
  "is_gluten_free": booleano (true se l'utente richiede esplicitamente che TUTTO il preventivo sia senza glutine, altrimenti false),
  "is_lactose_free": booleano (true se l'utente richiede esplicitamente che TUTTO il preventivo sia senza lattosio, altrimenti false),
  "is_vegetarian": booleano (true se l'utente richiede esplicitamente che TUTTO il preventivo sia vegetariano, altrimenti false),
  "is_vegan": booleano (true se l'utente richiede esplicitamente che TUTTO il preventivo sia vegano, altrimenti false),
  "is_traditional": booleano (true se l'utente richiede esplicitamente che TUTTO il preventivo sia tradizionale, altrimenti false),
  "manual_total_price": numero o null (se l'utente specifica un budget o un prezzo totale globale per l'intero preventivo, inserisci qui il numero, altrimenti null),
  "ai_explanation": "string (spiega in modo chiaro, accattivante e persuasivo le scelte fatte per questo preventivo, giustificando perché hai selezionato questi prodotti specifici e come si adattano perfettamente alla richiesta. Rivolgiti direttamente al cliente in tono cordiale e professionale. Massimo 3-4 frasi brevi.)"
}
IMPORTANTE:
${!isAdmin ? "- RISPETTA TASSATIVAMENTE il valore di \"is_sold_by_piece\" che trovi nel database per ogni prodotto. NON ALTERARLO MAI." : "- Se decidi di cambiare l'unità di misura (da KG a PEZZI o viceversa), assicurati che il prezzo corrispondente (price_per_piece o price_per_kg) sia presente e non sia zero."}
- PORZIONI (servings_per_unit): Se per un prodotto è specificato quante persone sazia un pezzo o un kg ("servings_per_unit"), usalo ESATTAMENTE per calcolare la quantità necessaria in base al numero degli invitati.
- LIMITI D'ORDINE: Assicurati che la quantità calcolata non sia mai inferiore a "min_order_quantity". Inoltre, la quantità finale deve rispettare l'incremento specificato in "order_increment" (es. se min è 10 e l'incremento è 5, le quantità valide sono 10, 15, 20...).
- Se l'utente chiede una quantità in "pezzi" (es. 100 tramezzini) ma il prodotto nel database è venduto a kg ("is_sold_by_piece": false), ${!isAdmin ? "CALCOLA TU a quanti KG corrispondono indicativamente quei pezzi e inserisci la quantità in KG. NON mettere 100 kg." : "puoi scegliere di impostare \"is_sold_by_piece\": true e inserire 100 come quantità, purché il prezzo per pezzo sia disponibile."}
- Se l'utente chiede una quantità in "kg" ma il prodotto nel database è venduto a pezzi ("is_sold_by_piece": true), ${!isAdmin ? "CALCOLA TU a quanti PEZZI corrispondono indicativamente quei kg e inserisci la quantità in PEZZI." : "puoi scegliere di impostare \"is_sold_by_piece\": false e inserire la quantità in KG, purché il prezzo per kg sia disponibile."}
- Se l'utente non specifica la quantità, DEDUCI TU una quantità proporzionata e adeguata al contesto del preventivo, rispettando rigorosamente l'unità di misura (KG o PEZZI) ${!isAdmin ? "stabilita nel database" : "più adatta al prodotto"}.
- VARIETÀ E QUANTITÀ MASSIMA: In eventi medi o grandi, prediligi sempre un'ALTA VARIETÀ di prodotti (es. 10-20 tipi diversi) piuttosto che pochi prodotti in enormi quantità. Per i prodotti venduti a KG, cerca di non superare mai i 2/3 kg per singolo prodotto (salvo specifiche e precise richieste dell'utente di quantità superiori).
- Fai molta attenzione alle richieste globali come "tutto senza glutine" o "budget totale di 500€".
- Restituisci SOLO IL JSON, senza blocchi di codice \`\`\` o altro testo.
`;

        const result = await generateWithFallback(0, aiPrompt);
        const responseText = result.response.text();
        let jsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(jsonStr);

        let total = 0;
        if (parsedData.items) {
            parsedData.items.forEach(item => {
                const price = item.is_sold_by_piece ? Number(item.price_per_piece) : Number(item.price_per_kg);
                total += (price || 0) * (Number(item.quantity) || 0);
            });
        }

        if (parsedData.manual_total_price !== undefined && parsedData.manual_total_price !== null) {
            parsedData.total_price = Number(parsedData.manual_total_price);
        } else {
            parsedData.total_price = total;
        }

        res.json(parsedData);
    } catch (error) {
        console.error('Error generating AI quote:', error);
        if (error && error.message && error.message.includes('Tutti i modelli AI sono momentaneamente non disponibili')) {
            res.status(429).json({ error: "Siamo sovraccarichi di richieste, riprova tra poco." });
        } else {
            res.status(500).json({ error: "Errore durante l'analisi del testo da parte dell'IA." });
        }
    }
});

// Save a new quote and get its unique ID
router.post('/', async (req, res) => {
    const { items, total_price, is_gluten_free, is_lactose_free, is_vegetarian, is_vegan, is_traditional, notes, menu_notes, event_date, client_name } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO quotes (items, total_price, is_gluten_free, is_lactose_free, is_vegetarian, is_vegan, is_traditional, notes, menu_notes, event_date, client_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
            [JSON.stringify(items), total_price, is_gluten_free || false, is_lactose_free || false, is_vegetarian || false, is_vegan || false, is_traditional || false, notes || null, menu_notes || null, event_date || null, client_name || null]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        console.error('Error saving quote:', err);
        res.status(500).json({ error: 'Server error saving quote' });
    }
});

// Get a quote by menu_id (Public Digital Menu)
router.get('/menu/:menuId', async (req, res) => {
    const { menuId } = req.params;
    try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(menuId)) {
            return res.status(400).json({ error: 'Invalid menu ID format' });
        }

        const result = await pool.query('SELECT * FROM quotes WHERE menu_id = $1', [menuId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Menu not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching quote by menu_id:', err);
        res.status(500).json({ error: 'Server error fetching menu' });
    }
});

// Get a quote by ID (Public)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Try exact match first if it's a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(id)) {
            const result = await pool.query('SELECT * FROM quotes WHERE id = $1', [id]);
            if (result.rows.length > 0) {
                return res.json(result.rows[0]);
            }
        }

        // If not found or not a full UUID, try a prefix match (casting UUID to TEXT)
        // Using ILIKE for case-insensitive matching
        const partialResult = await pool.query(
            'SELECT * FROM quotes WHERE id::text ILIKE $1 LIMIT 1',
            [`${id}%`]
        );

        if (partialResult.rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        res.json(partialResult.rows[0]);
    } catch (err) {
        console.error('Error fetching quote:', err);
        res.status(500).json({ error: 'Server error fetching quote' });
    }
});

// Update an existing quote (Admin)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { items, total_price, is_gluten_free, is_lactose_free, is_vegetarian, is_vegan, is_traditional, notes, menu_notes, event_date, client_name } = req.body;
    try {
        const result = await pool.query(
            'UPDATE quotes SET items = $1, total_price = $2, is_gluten_free = $3, is_lactose_free = $4, is_vegetarian = $5, is_vegan = $6, is_traditional = $7, notes = $8, menu_notes = $9, event_date = $10, client_name = $11, needs_sync = true WHERE id = $12 RETURNING *',
            [JSON.stringify(items), total_price, is_gluten_free || false, is_lactose_free || false, is_vegetarian || false, is_vegan || false, is_traditional || false, notes, menu_notes, event_date || null, client_name || null, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating quote:', err);
        res.status(500).json({ error: 'Server error updating quote' });
    }
});

// Mark quote as synced with OrderMaster
router.post('/:id/mark-synced', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE quotes SET needs_sync = false WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error marking quote as synced:', err);
        res.status(500).json({ error: 'Server error marking quote as synced' });
    }
});

// Helper to geocode an address into [lon, lat]
async function geocodeAddress(address) {
    const orsApiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (orsApiKey) {
        try {
            const url = `https://api.openrouteservice.org/geocode/search?api_key=${encodeURIComponent(orsApiKey)}&text=${encodeURIComponent(address)}&size=1`;
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (res.ok) {
                const data = await res.json();
                if (data.features && data.features.length > 0 && data.features[0].geometry) {
                    return {
                        coordinates: data.features[0].geometry.coordinates, // [lon, lat]
                        label: data.features[0].properties?.label || address,
                        source: 'OpenRouteService'
                    };
                }
            }
        } catch (err) {
            console.warn('OpenRouteService geocode error, attempting fallback:', err.message);
        }
    }

    // Fallback: OpenStreetMap Nominatim
    try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const nomRes = await fetch(nomUrl, {
            headers: {
                'User-Agent': 'MuseCateringDeliveryCalculator/1.0 (info@musecatering.it)',
                'Accept': 'application/json'
            }
        });
        if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (nomData && nomData.length > 0) {
                return {
                    coordinates: [parseFloat(nomData[0].lon), parseFloat(nomData[0].lat)],
                    label: nomData[0].display_name || address,
                    source: 'Nominatim'
                };
            }
        }
    } catch (err) {
        console.warn('Nominatim geocode error:', err.message);
    }

    return null;
}

// Helper to compute driving distance and duration between coordinates
async function getDrivingRoute(startCoord, endCoord, originText, destText) {
    const orsApiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (orsApiKey && startCoord && endCoord) {
        try {
            const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': orsApiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    coordinates: [startCoord, endCoord]
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.routes && data.routes.length > 0) {
                    const summary = data.routes[0].summary;
                    return {
                        distance_km: parseFloat((summary.distance / 1000).toFixed(1)),
                        duration_minutes: Math.round(summary.duration / 60),
                        source: 'OpenRouteService'
                    };
                }
            }
        } catch (err) {
            console.warn('OpenRouteService directions error, attempting fallback:', err.message);
        }
    }

    // Fallback: OSRM
    if (startCoord && endCoord) {
        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoord[0]},${startCoord[1]};${endCoord[0]},${endCoord[1]}?overview=false`;
            const osrmRes = await fetch(osrmUrl, {
                headers: { 'Accept': 'application/json' }
            });
            if (osrmRes.ok) {
                const osrmData = await osrmRes.json();
                if (osrmData.routes && osrmData.routes.length > 0) {
                    return {
                        distance_km: parseFloat((osrmData.routes[0].distance / 1000).toFixed(1)),
                        duration_minutes: Math.round(osrmData.routes[0].duration / 60),
                        source: 'OSRM'
                    };
                }
            }
        } catch (err) {
            console.warn('OSRM directions error:', err.message);
        }
    }

    // Fallback: AI estimation
    try {
        const aiPrompt = `Calcola la distanza stradale in auto approssimativa in km e la durata del tragitto in minuti tra:
Partenza: "${originText}"
Destinazione: "${destText}"
Rispondi ESCLUSIVAMENTE con un oggetto JSON valido nel seguente formato:
{"distance_km": 45.0, "duration_minutes": 40}`;
        const aiRes = await generateWithFallback(0, aiPrompt);
        const text = aiRes.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.distance_km && parsed.distance_km > 0) {
                return {
                    distance_km: parseFloat(Number(parsed.distance_km).toFixed(1)),
                    duration_minutes: Math.round(Number(parsed.duration_minutes) || 0),
                    source: 'AI (Gemini)'
                };
            }
        }
    } catch (err) {
        console.warn('Gemini distance fallback error:', err.message);
    }

    return null;
}

// Helper to get fuel price and car consumption via AI with Google Search Grounding
async function getFuelPriceAndConsumption(vehicleModel) {
    const currentDate = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    const hasVehicle = vehicleModel && typeof vehicleModel === 'string' && vehicleModel.trim().length > 0;
    const vehicleText = hasVehicle ? vehicleModel.trim() : '';

    const prompt = `Effettua una ricerca web in tempo reale su Google per trovare:
1. Il prezzo medio attuale della benzina al self-service in Italia oggi (${currentDate}) espresso in euro al litro (€/L).
2. ${hasVehicle ? `Il consumo medio reale di carburante per il veicolo: "${vehicleText}", espresso rigorosamente in kilometri per litro (km/l). Se non trovi il dato esatto, fornisci una stima tecnica realistica.` : `Poiché il veicolo non è specificato, imposta consumption_km_l esattamente a 18.0 km/l.`}

Non lasciare i campi vuoti o null.
Rispondi ESCLUSIVAMENTE con un oggetto JSON valido nel seguente formato, senza markdown e senza commenti:
{
  "fuel_price": <prezzo_medio_benzina_in_euro_al_litro>,
  "consumption_km_l": <consumo_in_km_al_litro>
}`;

    const extractData = (text) => {
        if (!text || typeof text !== 'string') return null;
        let fuelPrice = null;
        let consumptionKmL = null;

        // 1. Da JSON
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                const p = parseFloat(parsed.fuel_price || parsed.price || parsed.prezzo || parsed.price_per_liter);
                if (!isNaN(p) && p > 0.5 && p < 5.0) fuelPrice = parseFloat(p.toFixed(3));
                const c = parseFloat(parsed.consumption_km_l || parsed.consumption || parsed.consumo || parsed.km_per_liter);
                if (!isNaN(c) && c > 2.0 && c < 60.0) consumptionKmL = parseFloat(c.toFixed(1));
            } catch (e) {}
        }

        // 2. Regex fallback per fuel_price
        if (!fuelPrice) {
            const pMatch = text.match(/fuel_price["']?\s*:\s*(\d+[.,]\d+)/i) || text.match(/(\d+[.,]\d{2,3})/);
            if (pMatch) {
                const val = parseFloat(pMatch[1].replace(',', '.'));
                if (!isNaN(val) && val > 0.5 && val < 5.0) fuelPrice = parseFloat(val.toFixed(3));
            }
        }

        // 3. Regex fallback per consumption_km_l
        if (!consumptionKmL && hasVehicle) {
            const cMatch = text.match(/consumption_km_l["']?\s*:\s*(\d+[.,]?\d*)/i) || text.match(/(\d+[.,]?\d*)\s*km\/?l/i);
            if (cMatch) {
                const val = parseFloat(cMatch[1].replace(',', '.'));
                if (!isNaN(val) && val > 2.0 && val < 60.0) consumptionKmL = parseFloat(val.toFixed(1));
            }
        }

        if (!consumptionKmL) {
            consumptionKmL = 18.0; // Default di 18 km/l come richiesto
        }

        if (fuelPrice) {
            return { fuel_price: fuelPrice, consumption_km_l: consumptionKmL };
        }
        return null;
    };

    const validator = (text) => extractData(text) !== null;

    try {
        console.log(`🤖 Interrogazione AI con Ricerca Web per carburante e consumo auto ("${vehicleText || 'non specificato'}") - ${currentDate}...`);
        const res = await generateWithFallback(0, prompt, [], validator, true);
        const text = res.response.text();
        console.log('🤖 Risposta grezza finale AI:', text);

        const data = extractData(text);
        if (data) {
            console.log(`✅ Dati rilevati dall'IA: Benzina = ${data.fuel_price} €/L, Consumo = ${data.consumption_km_l} km/l`);
            return data;
        }
    } catch (err) {
        console.warn('⚠️ Tutti i modelli AI hanno fallito per prezzo/consumo:', err.message);
    }

    return { fuel_price: 2.00, consumption_km_l: 18.0 };
}

// Calculate delivery cost based on destination, vehicles count, vehicle model, travel time and fuel price
router.post('/calculate-delivery', async (req, res) => {
    try {
        const {
            destination,
            origin = 'Piazza san giuseppe, Irgoli 08020 Sardegna, Italia',
            round_trip = true,
            vehicles_count = 1,
            vehicle_model = '',
            consumption_km_l,
            custom_fuel_price
        } = req.body;

        if (!destination || typeof destination !== 'string' || !destination.trim()) {
            return res.status(400).json({ error: 'Destinazione richiesta per il calcolo del percorso' });
        }

        const trimmedDest = destination.trim();
        const trimmedOrigin = (origin && origin.trim()) ? origin.trim() : 'Piazza san giuseppe, Irgoli 08020 Sardegna, Italia';
        const numVehicles = Math.max(1, parseInt(vehicles_count) || 1);
        const trimmedVehicleModel = (vehicle_model && typeof vehicle_model === 'string') ? vehicle_model.trim() : '';

        // 1. Geocoding
        const [originGeo, destGeo] = await Promise.all([
            geocodeAddress(trimmedOrigin),
            geocodeAddress(trimmedDest)
        ]);

        // 2. Driving Route
        const route = await getDrivingRoute(
            originGeo?.coordinates,
            destGeo?.coordinates,
            trimmedOrigin,
            trimmedDest
        );

        if (!route || !route.distance_km || route.distance_km <= 0) {
            return res.status(422).json({
                error: `Impossibile calcolare il percorso tra "${trimmedOrigin}" e "${trimmedDest}". Verifica che l'indirizzo sia corretto.`
            });
        }

        // 3. Fuel Price & Vehicle Consumption Detection
        let fuelPrice = parseFloat(custom_fuel_price);
        let fuelPriceDetected = false;
        let consumptionKmL = parseFloat(consumption_km_l);
        let consumptionDetected = false;

        // Se uno dei due valori manca, interroga l'IA
        if (isNaN(fuelPrice) || fuelPrice <= 0 || isNaN(consumptionKmL) || consumptionKmL <= 0) {
            const aiData = await getFuelPriceAndConsumption(trimmedVehicleModel);
            if (isNaN(fuelPrice) || fuelPrice <= 0) {
                fuelPrice = aiData.fuel_price;
                fuelPriceDetected = true;
            }
            if (isNaN(consumptionKmL) || consumptionKmL <= 0) {
                consumptionKmL = aiData.consumption_km_l;
                consumptionDetected = true;
            }
        }

        if (!consumptionKmL || consumptionKmL <= 0) {
            consumptionKmL = 18.0; // Default di sicurezza: 18 km/l
        }

        // 4. Calculations
        const isRoundTrip = round_trip !== false;
        const oneWayKm = route.distance_km;
        const totalKmPerVehicle = isRoundTrip ? parseFloat((oneWayKm * 2).toFixed(1)) : oneWayKm;
        const totalKmAllVehicles = parseFloat((totalKmPerVehicle * numVehicles).toFixed(1));

        // Litri totali consumati da tutte le macchine
        const litersNeeded = parseFloat(((totalKmPerVehicle / consumptionKmL) * numVehicles).toFixed(2));
        const baseFuelCost = parseFloat((litersNeeded * fuelPrice).toFixed(2));

        // Maggiorazione Imprevisti: 12% sul costo carburante
        const contingencyPercent = 12;
        const contingencyCost = parseFloat((baseFuelCost * 0.12).toFixed(2));

        // Durata e Sovrapprezzo Tempo di Viaggio: 13 € all'ora per macchina
        const oneWayMinutes = Math.round(Number(route.duration_minutes) || 0);
        const totalMinutesPerVehicle = isRoundTrip ? (oneWayMinutes * 2) : oneWayMinutes;
        const hourlyRate = 13.0; // 13 €/ora
        const durationHoursPerVehicle = totalMinutesPerVehicle / 60;
        const timeCostPerVehicle = parseFloat((durationHoursPerVehicle * hourlyRate).toFixed(2));
        const totalTimeCost = parseFloat((timeCostPerVehicle * numVehicles).toFixed(2));

        // Costo Totale Consegna (Carburante + Imprevisti 12% + Tempo 13€/h per mezzo)
        const totalCost = parseFloat((baseFuelCost + contingencyCost + totalTimeCost).toFixed(2));

        // Duration text
        let durationText = '';
        if (totalMinutesPerVehicle > 0) {
            const hours = Math.floor(totalMinutesPerVehicle / 60);
            const remainingMins = totalMinutesPerVehicle % 60;
            if (hours > 0) {
                durationText = `${hours}h ${remainingMins} min${isRoundTrip ? ' (A/R)' : ''}`;
            } else {
                durationText = `${remainingMins} min${isRoundTrip ? ' (A/R)' : ''}`;
            }
        }

        res.json({
            success: true,
            origin: originGeo?.label || trimmedOrigin,
            destination: destGeo?.label || trimmedDest,
            one_way_km: oneWayKm,
            total_km: totalKmPerVehicle,
            total_km_all_vehicles: totalKmAllVehicles,
            vehicles_count: numVehicles,
            vehicle_model: trimmedVehicleModel || 'Non specificato (Default 18 km/l)',
            round_trip: isRoundTrip,
            duration_minutes: totalMinutesPerVehicle,
            duration_text: durationText,
            duration_hours: parseFloat(durationHoursPerVehicle.toFixed(2)),
            consumption_km_l: consumptionKmL,
            consumption_detected: consumptionDetected,
            fuel_price_per_liter: fuelPrice,
            fuel_price_detected: fuelPriceDetected,
            liters_needed: litersNeeded,
            base_fuel_cost: baseFuelCost,
            contingency_percent: contingencyPercent,
            contingency_cost: contingencyCost,
            hourly_rate: hourlyRate,
            time_cost: totalTimeCost,
            total_cost: totalCost,
            routing_source: route.source
        });
    } catch (err) {
        console.error('Error in calculate-delivery:', err);
        res.status(500).json({ error: err.message || 'Errore nel calcolo del percorso' });
    }
});

export default router;


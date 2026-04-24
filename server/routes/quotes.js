import express from 'express';
import { pool } from '../db.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const MODEL_WATERFALL = [
  'gemini-2.5-flash',
  'gemini-2.5-pro'
];

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

async function generateWithFallback(modelIndex, prompt, imageParts = []) {
  if (modelIndex >= MODEL_WATERFALL.length) {
    throw new Error("Tutti i modelli AI sono momentaneamente non disponibili (Quota esaurita o Errore server).");
  }

  const currentModelName = MODEL_WATERFALL[modelIndex];
  console.log(`🤖 Tentativo AI con modello: ${currentModelName} (Priorità ${modelIndex + 1}/${MODEL_WATERFALL.length})`);

  try {
    const model = genAI.getGenerativeModel({ model: currentModelName });
    const result = await model.generateContent([prompt, ...imageParts]);
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
      return generateWithFallback(modelIndex + 1, prompt, imageParts);
    }
    console.error(`❌ Errore fatale non recuperabile con ${currentModelName}:`, errorMsg);
    throw error;
  }
}

// Generate AI quote
router.post('/ai-generate', async (req, res) => {
    const { prompt } = req.body;

    try {
        const productsResult = await pool.query('SELECT * FROM products');
        const productsList = productsResult.rows.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price_per_kg: p.price_per_kg,
            price_per_piece: p.price_per_piece,
            is_sold_by_piece: p.is_sold_by_piece,
            is_gluten_free: p.is_gluten_free,
            is_lactose_free: p.is_lactose_free
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
      "is_sold_by_piece": booleano (imposta a true per pezzi/porzioni, false per kg/chili. Se non specificato, decidi in autonomia la scelta più logica per il tipo di prodotto),
      "price_per_piece": prezzo unitario (dal db),
      "price_per_kg": prezzo al kg (dal db),
      "name": "nome prodotto",
      "description": "descrizione",
      "is_gluten_free": booleano,
      "is_lactose_free": booleano
    }
  ],
  "is_gluten_free": booleano (true se l'utente richiede esplicitamente che TUTTO il preventivo sia senza glutine, altrimenti false),
  "is_lactose_free": booleano (true se l'utente richiede esplicitamente che TUTTO il preventivo sia senza lattosio, altrimenti false),
  "manual_total_price": numero o null (se l'utente specifica un budget o un prezzo totale globale per l'intero preventivo, inserisci qui il numero, altrimenti null)
}
IMPORTANTE:
- Controlla se l'utente specifica la quantità in "kg" o in "pezzi"/"pz" e imposta "is_sold_by_piece" di conseguenza (true per pezzi, false per kg).
- Se l'utente NON specifica l'unità di misura per un prodotto, DEDUCI TU se è più logico calcolarlo a chili (false) o a pezzi/porzioni (true) in base alla natura del prodotto (es. una torta a kg, dei salatini a pezzi) e al contesto del preventivo (es. numero di invitati).
- Se l'utente non specifica la quantità, DEDUCI TU una quantità proporzionata e adeguata al contesto del preventivo (es. calcola circa 200g-300g di carne a persona se è a kg, oppure 1 pezzo a persona).
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
    const { items, total_price, is_gluten_free, is_lactose_free, notes, menu_notes } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO quotes (items, total_price, is_gluten_free, is_lactose_free, notes, menu_notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [JSON.stringify(items), total_price, is_gluten_free || false, is_lactose_free || false, notes || null, menu_notes || null]
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
    const { items, total_price, is_gluten_free, is_lactose_free, notes, menu_notes } = req.body;
    try {
        const result = await pool.query(
            'UPDATE quotes SET items = $1, total_price = $2, is_gluten_free = $3, is_lactose_free = $4, notes = $5, menu_notes = $6 WHERE id = $7 RETURNING *',
            [JSON.stringify(items), total_price, is_gluten_free || false, is_lactose_free || false, notes, menu_notes, id]
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

export default router;

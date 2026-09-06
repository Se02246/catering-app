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

export default router;

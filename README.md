# Catering App

Applicazione web per la gestione di servizi di catering, preventivi personalizzati e amministrazione prodotti.

## Setup Locale

### Prerequisiti
- Node.js (v18+)
- PostgreSQL (o accesso a Neon DB)

### Installazione
1.  Clona il repository.
2.  Installa le dipendenze:
    ```bash
    npm install
    ```

### Configurazione Database
1.  Crea un file `.env` nella root (copia da `.env.example` se presente):
    ```env
    DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
    PORT=3000
    ```
2.  Inizializza il database eseguendo lo script SQL:
    Se hai `psql` installato:
    ```bash
    psql "tua-stringa-di-connessione" -f server/init.sql
    ```
    Oppure esegui i comandi contenuti in `server/init.sql` nella console SQL del tuo provider (es. Neon Console).

### Avvio Sviluppo
1.  Avvia il Backend:
    ```bash
    npm run dev:server
    ```
2.  Avvia il Frontend (in un altro terminale):
    ```bash
    npm run dev
    ```

## Funzionalità
- **Admin**: Login (`admin`/`admin`), Gestione Prodotti, Creazione Pacchetti.
- **Cliente**: Visualizzazione Menu, Creazione Preventivo, Export PDF.

## Deployment (Vercel)
Il progetto è configurato per il deployment su Vercel.
1.  Installa Vercel CLI o collega il repository GitHub a Vercel.
2.  Assicurati che le variabili d'ambiente (es. `DATABASE_URL`) siano configurate nel progetto Vercel.
3.  Deploya con `vercel` o tramite push su GitHub.

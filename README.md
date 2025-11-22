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

## Deployment (Render)
Il progetto include un file `render.yaml` per il deployment automatico su Render.com.
1.  Crea un nuovo "Blueprint" su Render.
2.  Collega questo repository.
3.  Render creerà automaticamente il Web Service (Backend), il Sito Statico (Frontend) e il Database.

# Trader Vision - Workspace Locale

Benvenuto nel setup locale di Trader Vision. Questa configurazione ti permette di "smanettare" sulla versione locale senza influenzare il repository remoto finché non decidi di fare il push.

## Sviluppo Locale

Per avviare sia il **Frontend** che il **Backend** contemporaneamente:

```bash
npm run dev
```

Questo comando avvierà:
- **Backend**: su `http://localhost:5001` (o la porta configurata in `backend/.env`)
- **Frontend**: su `http://localhost:5173` (Vite)

### Altri Comandi Utili

- `npm run frontend`: Avvia solo il frontend.
- `npm run backend`: Avvia solo il backend.
- `npm run install:all`: Installa le dipendenze in tutte le cartelle (root, frontend, backend).

## Workflow GitHub

Tutte le modifiche che facciamo insieme rimarranno **solo in locale** in questo workspace. 

Quando sarai soddisfatto delle modifiche e vorrai caricarle su GitHub, basterà chiedermelo:
> *"Ok, fai il push su GitHub"*

Io mi occuperò di fare il commit e il push per te.

---

**Nota**: Assicurati di avere i file `.env` configurati sia in `backend/` che in `frontend/` (se necessari).

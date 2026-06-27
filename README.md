# Recall — Smart Flashcard App

A customer-centric Anki-style flashcard app built with React, TypeScript, and Tailwind CSS. Paste large notes and auto-parse them into topic-organized flashcards with spaced repetition, quiz mode, and revisit reminders.

## Features

- **Smart Parse** — Paste large text; auto-detects topics (`#` headers), Q&A pairs (`Q:`/`A:`), front/back blocks, and term definitions
- **Structured Import** — Separate front/back fields for manual card creation
- **Topic Organization** — Cards grouped by detected topics within each deck
- **Study Mode** — Flip cards with spaced repetition (Again / Hard / Good / Easy)
- **Quiz Mode** — Multiple-choice quiz from your deck
- **Reminders** — Due cards, flagged revisit items, and upcoming schedule
- **Local-first** — All data persisted in browser IndexedDB (auto-migrates from localStorage)

## Getting Started

```bash
cd anki-flashcards
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Smart Parse Format Examples

```
# Cell Biology

Q: What is mitosis?
A: Cell division producing two identical daughter cells.

# Genetics
- DNA — Deoxyribonucleic acid
- Gene — A segment of DNA that codes for a protein
```

Also supports:
- `Front:` / `Back:` blocks separated by `---`
- Numbered questions ending with `?`
- `[Topic Name]` section headers

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Lucide React icons

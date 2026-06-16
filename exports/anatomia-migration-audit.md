# Audyt migracji anatomii → `anatomia` (kanoniczny)

**Wygenerowano:** 2026-05-28T14:03:51.304Z

## Podsumowanie

| Metryka | Wartość |
| --- | --- |
| topicsTotal | 20 |
| questionsTotal | 766 |
| questionsActive | 754 |
| crossTrackPairs | 95 |
| crossTrackDiverged | 94 |
| internalDuplicateGroupsAllStoma | 0 |
| internalDuplicateGroupsStomaOnly | 0 |
| dualProgressUsers | 3795 |
| questionEditsTotal | 62 |

## Topiki

- STOMA (`stoma-anatomia`): **10**
- LEK (`lek-anatomia`): **10**
- Pary rodzin (`ANA-*` ↔ `LEK-ANA-*`): **10**
- Tylko STOMA (brak LEK-ANA): **0**
- Tylko LEK (brak ANA): **0**

## Pytania cross-track (pary `ana-*` ↔ `lek-ana-*`)

- Par z oboma rekordami: **95**
- Treść identyczna (hash): **1**
- Treść rozjechana: **94**
- Tylko `ana-*` (bez lek peer): **576**
- Tylko `lek-ana-*` (bez ana peer): **0**
- Rekomendowany kanoniczny = zawsze `ana-*` po merge: **93**
- Wyjątki (kanoniczny byłby `lek-*` — nowsza edycja): **2**
- Odpowiedzi w sesjach na stronie LEK (łącznie): **9986**
- Odpowiedzi w sesjach na stronie STOMA (łącznie): **7736**

> **Uwaga:** „Rozjechane” pary to często różne wersje merytoryczne (STOMA rozbudowane vs LEK skrót), niekoniecznie błąd syncu. Przed migracją zsynchronizuj treść ze strony STOMA (`ana-*`) na `lek-ana-*` lub usuń duplikat LEK.

### Próbka rozjechanych par (max 25)

- `ana-cza-001` ↔ `lek-ana-cza-001` | sto: df04da1730204c78 lek: 3937d99ea93ad0e9 | pick: `ana-cza-001` (default:stoma-id)
- `ana-cza-002` ↔ `lek-ana-cza-002` | sto: a97db6ddfb15d953 lek: 24162c8cf2f6d58f | pick: `ana-cza-002` (default:stoma-id)
- `ana-cza-003` ↔ `lek-ana-cza-003` | sto: d6c0a7660d68afe2 lek: 6c75003dcf7798ef | pick: `ana-cza-003` (default:stoma-id)
- `ana-cza-004` ↔ `lek-ana-cza-004` | sto: 699c6908fc1478bc lek: 5a7ea2192b7d67d2 | pick: `ana-cza-004` (default:stoma-id)
- `ana-cza-005` ↔ `lek-ana-cza-005` | sto: 855e6c37d769cf89 lek: 8d1c45dd1190fddc | pick: `ana-cza-005` (default:stoma-id)
- `ana-cza-006` ↔ `lek-ana-cza-006` | sto: a8b84b331c3aef2c lek: 3e1d226bd1a340cd | pick: `ana-cza-006` (default:stoma-id)
- `ana-cza-007` ↔ `lek-ana-cza-007` | sto: 3513bb510de77dc5 lek: 1aca342271440667 | pick: `ana-cza-007` (default:stoma-id)
- `ana-cza-008` ↔ `lek-ana-cza-008` | sto: 5417d48642613731 lek: bbb154fa8e41eda4 | pick: `ana-cza-008` (default:stoma-id)
- `ana-jam-001` ↔ `lek-ana-jam-001` | sto: 4b69f50f2b99ab9c lek: 7cb9f9e718cb435b | pick: `ana-jam-001` (default:stoma-id)
- `ana-kon-001` ↔ `lek-ana-kon-001` | sto: 6e8aa54c5d4b8e09 lek: bbbf24dd4974d883 | pick: `lek-ana-kon-001` (question_edits:lek-newer)
- `ana-kon-002` ↔ `lek-ana-kon-002` | sto: b9c45c6bb4e4109b lek: a04ce2763a02a8f8 | pick: `ana-kon-002` (default:stoma-id)
- `ana-kon-003` ↔ `lek-ana-kon-003` | sto: c2d94cb8ab0f6b55 lek: f773cba862d74bc8 | pick: `ana-kon-003` (default:stoma-id)
- `ana-kon-004` ↔ `lek-ana-kon-004` | sto: 63bc19d9a2c06461 lek: 8de2875fca68d90d | pick: `ana-kon-004` (default:stoma-id)
- `ana-kon-005` ↔ `lek-ana-kon-005` | sto: a72e727ed174677f lek: c70fb83fbfa61539 | pick: `ana-kon-005` (default:stoma-id)
- `ana-kon-006` ↔ `lek-ana-kon-006` | sto: 3bd17b4c4e55ba55 lek: 40e66d4659d1023a | pick: `ana-kon-006` (default:stoma-id)
- `ana-kon-007` ↔ `lek-ana-kon-007` | sto: 0cabfb5e529c3dcd lek: 491c62e9b4b11c21 | pick: `ana-kon-007` (default:stoma-id)
- `ana-kon-008` ↔ `lek-ana-kon-008` | sto: f09c111004488c16 lek: 7e15d1639fc1d25c | pick: `ana-kon-008` (default:stoma-id)
- `ana-kon-009` ↔ `lek-ana-kon-009` | sto: 994ee1b62ac3e909 lek: 8582cd6af8c6196d | pick: `ana-kon-009` (default:stoma-id)
- `ana-kon-010` ↔ `lek-ana-kon-010` | sto: 5a79b6b87c2ef1a7 lek: 123f3eba45641afb | pick: `ana-kon-010` (default:stoma-id)
- `ana-kon-011` ↔ `lek-ana-kon-011` | sto: 07609f1a64fe1d99 lek: ac212e155fad3d7b | pick: `ana-kon-011` (default:stoma-id)
- `ana-kon-012` ↔ `lek-ana-kon-012` | sto: 635b47404598cf70 lek: cebb1470a480e6e4 | pick: `ana-kon-012` (default:stoma-id)
- `ana-mie-001` ↔ `lek-ana-mie-001` | sto: 50f8b286c44df595 lek: 5be7a673f199e63c | pick: `ana-mie-001` (default:stoma-id)
- `ana-mie-002` ↔ `lek-ana-mie-002` | sto: 8822e5fcdeda2d4c lek: 028b878fc88b9cdf | pick: `ana-mie-002` (default:stoma-id)
- `ana-mie-003` ↔ `lek-ana-mie-003` | sto: fada4c244c2b8564 lek: cc728867f78f3129 | pick: `ana-mie-003` (default:stoma-id)
- `ana-mie-004` ↔ `lek-ana-mie-004` | sto: 3cc92b81dca01356 lek: 48ad6cbd8fe3e699 | pick: `ana-mie-004` (default:stoma-id)

## Duplikaty wewnętrzne STOMA (ten sam hash treści)

### Wszystkie `ana-*` (łącznie z parami LEK)

- Grup: **0** | pytań w grupach: **0** | nadmiarowych: **0**

### Tylko `ana-*` bez rekordu `lek-ana-*`

- Grup: **0** | nadmiarowych: **0**

## Referencje FK (pytania anatomii)

- **session_answers**: 68737 wpisów, 765 pytań
- **question_discussions**: 4 wpisów, 2 pytań
- **saved_questions**: 286 wpisów, 227 pytań
- **error_reports**: 39 wpisów, 32 pytań

- **question_edits**: 57 pytań z edycjami, 62 wpisów łącznie
- **Użytkownicy z postępem na OBU ID pary**: 3795

### Próbka dual progress (max 20)

- user `c6c01cbb…` | ana-cza-001|lek-ana-cza-001
- user `36bb6bde…` | ana-cza-001|lek-ana-cza-001
- user `5444e6ab…` | ana-cza-001|lek-ana-cza-001
- user `1aa19179…` | ana-cza-001|lek-ana-cza-001
- user `1495cd68…` | ana-cza-001|lek-ana-cza-001
- user `2cbb6575…` | ana-cza-001|lek-ana-cza-001
- user `0e5e70c1…` | ana-cza-001|lek-ana-cza-001
- user `1f8ab602…` | ana-cza-001|lek-ana-cza-001
- user `28682a27…` | ana-cza-001|lek-ana-cza-001
- user `2dd7c994…` | ana-cza-001|lek-ana-cza-001
- user `da87a885…` | ana-cza-001|lek-ana-cza-001
- user `881f6465…` | ana-cza-001|lek-ana-cza-001
- user `5cb49b16…` | ana-cza-001|lek-ana-cza-001
- user `2e5d62ee…` | ana-cza-001|lek-ana-cza-001
- user `db22fb9a…` | ana-cza-001|lek-ana-cza-001
- user `c8ed883d…` | ana-cza-001|lek-ana-cza-001
- user `635934b0…` | ana-cza-001|lek-ana-cza-001
- user `295ec60a…` | ana-cza-001|lek-ana-cza-001
- user `0b63ffa3…` | ana-cza-001|lek-ana-cza-001
- user `3a55f36c…` | ana-cza-001|lek-ana-cza-001

## Następne kroki

1. Re-sync rozjechanych par (admin lub SQL) przed migracją.
2. Migracja FK: `lek-ana-*` → `ana-*`, merge `user_question_progress`.
3. Scalenie topików `LEK-ANA-*` → `ANA-*`, `subject_id` → `anatomia`.
4. Dedup wewnętrzny STOMA (`is_active = false` na nadmiarowych).
5. Widoczność topików per `track` dla LEK (jeśli całość w `anatomia`).

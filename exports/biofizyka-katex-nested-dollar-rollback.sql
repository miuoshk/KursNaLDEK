-- Rollback dla naprawy zagnieżdżonych `$` w treści pytań (2026-06-20)
-- Przywraca oryginalne (uszkodzone) wartości text.
BEGIN;

UPDATE public.questions
   SET text = 'Po wykonaniu n pomiarów wielkości X obliczamy parametry statystyczne. Równanie $\sqrt{\dfrac{1}{n($n$ -1)}\sum_{i=1}^{n}\left(x_i - \bar{x}\right)^2}$ jest wykorzystywane do obliczenia:'
 WHERE id = 'biofiz-w1-319';

UPDATE public.questions
   SET text = 'Pęd fotonu określamy wzorem ($h$ – stała Plancka, $$u$$ – częstotliwość promieniowania, $c$ – prędkość światła, $\lambda$ – długość fali):'
 WHERE id = 'biofiz-w5-384';

UPDATE public.questions
   SET text = 'Wzór $Ef = h$· ν = h · c / λ przedstawia energią fotonu, przy czym',
       options = '[{"id":"a","text":"$\lambda jest stałą Plancka, v jest prędkością rozchodzenia się promieniowania, h jest długością fali promieniowania a c jest częstotliwością$"},{"id":"b","text":"$v jest stałą Plancka, c jest prędkością rozchodzenia się promieniowania, \lambda jest długością fali promieniowania a h jest częstotliwością$"},{"id":"c","text":"$h jest stałą Plancka, c jest prędkością rozchodzenia się promieniowania, \lambda jest długością fali promieniowania a v jest częstotliwością$"},{"id":"d","text":"$h jest stałą Plancka, c jest prędkością rozchodzenia się promieniowania, v jest długością fali promieniowania a \lambda jest częstotliwością$"}]'::jsonb,
       explanation = 'E = h*nu = h*c/lambda, gdzie: h - stala Plancka (6.63*340^{-34}$ J*s), c - predkosc swiatla, lambda - dlugosc fali, nu (v) - czestotliwosc. To podstawowe rownanie Plancka dla energii fotonu.'
 WHERE id = 'biofiz-w4-003';

COMMIT;

-- ============================================================
-- 2026-06-20 (część 2): podwójny backslash `\\` w matematyce
-- `\\` = twardy łamacz wiersza w KaTeX → funkcje (sin/cos/π) lądowały
-- w nowej linii i traciły styl operatora. Naprawa: `\\` → `\`
-- (oraz zdublowane `\cos\cos` → `\cos` w biofiz-s3-365 opcje a, c).
-- Dotknięte ID: biofiz-c1-022, c2-013, c2-354, s3-365, w5-024,
--               w5-197, w5-312, w5-315
-- Rollback nie jest odwracalny 1:1 (nie da się odróżnić, które `\`
-- pochodziły z `\\`); stan sprzed naprawy był po prostu uszkodzony.
-- ============================================================

-- ============================================================
-- 2026-06-20 (część 3): zepsuty `$` w wyjaśnieniu biofiz-c1-003
-- (`$\$\lambda = h/(mv)$= h/p$` → poprawny inline-math + polskie znaki)
-- ============================================================
UPDATE public.questions
   SET explanation = 'Hipoteza de Brogliea: kazda czastka w ruchu ma przypisana fale o dlugosci $\$\lambda = h/(mv)$= h/p$, gdzie h to stala Plancka, m masa, v predkosc. Elektrony w mikroskopie elektronowym maja krotsza fale niz swiatlo.'
 WHERE id = 'biofiz-c1-003';

-- ============================================================
-- 2026-06-20 (część 4): proza uwięziona w $...$ (KaTeX skleja tekst)
-- Naprawa: proza przeniesiona poza $...$, w matematyce tylko wzór.
-- c2-003 (opcje + wyj.), s2-091 (wyj. $\omega_L$), oraz batch:
--   c1-030, c1-341, c2-013, c4-030, s2-050, s2-105, s2-124, s2-134,
--   s2-141, w3-018, w4-004, w4-023, w5-101, w5-191, w5-256, w5-272.
-- Snapshot oryginałów: patrz historia czatu / audyt (zbyt obszerne na
-- pełny rollback inline). correct_option_id bez zmian.
-- ============================================================


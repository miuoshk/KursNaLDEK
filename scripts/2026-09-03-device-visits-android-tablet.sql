-- Rozszerza klasyfikację o tablety Android (osobno od telefonów).
ALTER TABLE public.device_visits
  DROP CONSTRAINT IF EXISTS device_visits_class_chk;

ALTER TABLE public.device_visits
  ADD CONSTRAINT device_visits_class_chk
  CHECK (device_class IN (
    'mac',
    'iphone',
    'ipad',
    'android',
    'android_tablet',
    'windows',
    'other'
  ));

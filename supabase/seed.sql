-- ============================================================
-- ANISTOCK — Seed
-- Catálogo de productos cafetería y aseo.
-- ============================================================

insert into public.products (name, category, unit) values
  -- Cafetería
  ('Café molido 250 g',          'cafeteria', 'paquete'),
  ('Azúcar 500 g',               'cafeteria', 'paquete'),
  ('Crema de leche 200 ml',      'cafeteria', 'unidad'),
  ('Vasos desechables',          'cafeteria', 'paquete'),
  ('Servilletas',                 'cafeteria', 'paquete'),
  ('Té en bolsitas',              'cafeteria', 'caja'),
  ('Bombillos / pajillas',        'cafeteria', 'paquete'),
  ('Mezcladores',                 'cafeteria', 'caja'),
  -- Aseo
  ('Jabón de manos',              'aseo', 'litro'),
  ('Papel higiénico',             'aseo', 'paquete'),
  ('Toalla de papel',             'aseo', 'paquete'),
  ('Detergente en polvo 1 kg',    'aseo', 'unidad'),
  ('Cloro 1 galón',               'aseo', 'galon'),
  ('Desinfectante 1 L',           'aseo', 'litro'),
  ('Espuma limpiadora',           'aseo', 'unidad'),
  ('Limpiavidrios',               'aseo', 'litro'),
  ('Escoba',                      'aseo', 'unidad'),
  ('Recogedor',                   'aseo', 'unidad'),
  ('Trapeador / lampazo',         'aseo', 'unidad'),
  ('Bolsa de basura',             'aseo', 'paquete')
on conflict (name, category) do nothing;
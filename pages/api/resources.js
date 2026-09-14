import { getSupabaseAdmin } from '../../lib/supabase';

function isAuthorized(req) {
  const password = req.headers['x-admin-password'];
  return password && password === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();

  // 1. Получить список всех ресурсов
  if (req.method === 'GET') {
    if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

    const { track, type } = req.query;
    let query = supabase.from('resources').select('*').order('created_at', { ascending: false });

    if (track) query = query.eq('track', track);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // 2. Добавить новый ресурс
  if (req.method === 'POST') {
    if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

    const { title, description, type, track, link } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    const { data, error } = await supabase
      .from('resources')
      .insert([
        {
          title,
          description: description || null,
          type: type || 'курс',
          track: track || 'Общее',
          link: link || null,
        },
      ])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  }

  // 3. Изменить существующий ресурс
  if (req.method === 'PUT') {
    if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

    const { id, title, description, type, track, link } = req.body;
    if (!id) return res.status(400).json({ error: 'id обязателен' });

    const { data, error } = await supabase
      .from('resources')
      .update({
        title,
        description: description || null,
        type: type || 'курс',
        track: track || 'Общее',
        link: link || null,
      })
      .eq('id', id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data[0]);
  }

  // 4. Удалить ресурс
  if (req.method === 'DELETE') {
    if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id обязателен' });

    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end();
}
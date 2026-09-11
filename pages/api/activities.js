import { getSupabaseAdmin } from '../../lib/supabase';

function isAuthorized(req) {
  const password = req.headers['x-admin-password'];
  return password && password === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('deadline', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { title, description, deadline, remind_days_before } = req.body;
    if (!title || !deadline) {
      return res.status(400).json({ error: 'title и deadline обязательны' });
    }
    const { data, error } = await supabase
      .from('activities')
      .insert([
        {
          title,
          description: description || null,
          deadline,
          remind_days_before: remind_days_before ?? 1,
        },
      ])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  }

  if (req.method === 'PUT') {
    if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { id, title, description, deadline, remind_days_before } = req.body;
    if (!id) return res.status(400).json({ error: 'id обязателен' });
    const { data, error } = await supabase
      .from('activities')
      .update({
        title,
        description: description || null,
        deadline,
        remind_days_before,
        reminder_sent: false, // если дедлайн изменили, напоминание отправим заново
      })
      .eq('id', id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data[0]);
  }

  if (req.method === 'DELETE') {
    if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id обязателен' });
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end();
}

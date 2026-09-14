import { getSupabaseAdmin } from '../../lib/supabase';

function getUserId(req) {
  return (
    req.headers['x-user-id'] || req.query.user_id || process.env.DEMO_USER_ID || 'demo-user'
  );
}

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();
  const userId = getUserId(req);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { title, event_date, event_time, description, category, link, activity_id } = req.body;
    if (!title || !event_date) {
      return res.status(400).json({ error: 'title и event_date обязательны' });
    }
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([
        {
          user_id: userId,
          activity_id: activity_id || null,
          title,
          description: description || null,
          event_date,
          event_time: event_time || null,
          category: category || null,
          link: link || null,
        },
      ])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  }

  if (req.method === 'PUT') {
    const { id, title, event_date, event_time, description, category, link } = req.body;
    if (!id) return res.status(400).json({ error: 'id обязателен' });
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        title,
        event_date,
        event_time: event_time || null,
        description: description || null,
        category: category || null,
        link: link || null,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id обязателен' });
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end();
}

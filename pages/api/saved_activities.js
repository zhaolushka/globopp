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
      .from('saved_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    // Load activity details for each saved record
    const ids = data.map((s) => s.activity_id).filter(Boolean);
    let activities = [];
    if (ids.length > 0) {
      const { data: acts } = await supabase
        .from('activities')
        .select('*')
        .in('id', ids);
      activities = acts || [];
    }

    const payload = data.map((s) => ({ saved: s, activity: activities.find((a) => a.id === s.activity_id) || null }));
    return res.status(200).json(payload);
  }

  if (req.method === 'POST') {
    const { activity_id } = req.body;
    if (!activity_id) return res.status(400).json({ error: 'activity_id обязателен' });

    // Prevent duplicates
    const { data: existing } = await supabase
      .from('saved_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_id', activity_id);

    if (existing && existing.length > 0) {
      return res.status(200).json(existing[0]);
    }

    const { data, error } = await supabase
      .from('saved_activities')
      .insert([{ user_id: userId, activity_id }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  }

  if (req.method === 'DELETE') {
    const { activity_id } = req.body;
    if (!activity_id) return res.status(400).json({ error: 'activity_id обязателен' });
    const { error } = await supabase
      .from('saved_activities')
      .delete()
      .eq('user_id', userId)
      .eq('activity_id', activity_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end();
}

import { getSupabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();

  // Принимаем track (направление) и chat_id студента
  const track = req.query.track || req.body?.track;
  const chatId = req.query.chat_id || req.body?.chat_id;

  if (!track && !chatId) {
    return res.status(400).json({ error: 'Укажите track или chat_id студента' });
  }

  let studentTrack = track;

  // Если передан chat_id, достанем направление студента из базы
  if (chatId) {
    const { data: student } = await supabase
      .from('subscribers')
      .select('*')
      .eq('telegram_chat_id', chatId)
      .single();

    if (student && student.direction) {
      studentTrack = student.direction;
    }
  }

  // Находим подходящие ресурсы под направление
  const { data: resources, error: resError } = await supabase
    .from('resources')
    .select('*')
    .or(`track.ilike.%${studentTrack || ''}%,track.eq.Общее`);

  if (resError) return res.status(500).json({ error: resError.message });

  // Также достаем ближайшие актуальные дедлайны
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .gte('deadline', new Date().toISOString())
    .order('deadline', { ascending: true })
    .limit(5);

  return res.status(200).json({
    track: studentTrack,
    recommendedResources: resources || [],
    upcomingDeadlines: activities || [],
  });
}
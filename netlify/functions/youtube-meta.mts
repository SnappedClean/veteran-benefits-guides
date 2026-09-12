export default async (req: Request) => {
  const url = new URL(req.url);
  const id = (url.searchParams.get('id') || '').trim();
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
    return Response.json({ error: 'invalid id' }, { status: 400 });
  }

  const watchUrl = `https://www.youtube.com/watch?v=${id}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;

  let oembed: any = null;
  let description = '';
  let keywords: string[] = [];
  let uploadDate = '';

  try {
    const r = await fetch(oembedUrl, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (r.ok) oembed = await r.json();
  } catch {}

  try {
    const r = await fetch(watchUrl, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9'
      }
    });
    if (r.ok) {
      const html = await r.text();
      const descMatch = html.match(/\"shortDescription\":\"((?:\\.|[^\"\\])*)\"/);
      if (descMatch) {
        try { description = JSON.parse(`\"${descMatch[1]}\"`); } catch {}
      }
      const kwMatch = html.match(/\"keywords\":\[(.*?)\]/);
      if (kwMatch) {
        try { keywords = JSON.parse(`[${kwMatch[1]}]`); } catch {}
      }
      const dateMatch = html.match(/\"uploadDate\":\"([^\"]+)\"/);
      if (dateMatch) uploadDate = dateMatch[1];
    }
  } catch {}

  return Response.json({
    id,
    title: oembed?.title || '',
    author: oembed?.author_name || '',
    thumbnail: oembed?.thumbnail_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    description,
    keywords,
    uploadDate,
    watchUrl
  }, {
    headers: { 'cache-control': 'public, max-age=3600' }
  });
};

export const config = {
  path: '/api/youtube-meta'
};

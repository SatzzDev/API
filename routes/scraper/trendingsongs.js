import axios from 'axios'
import * as cheerio from 'cheerio'

export async function SpotifyDailyChart(country = 'global') {
  try {
    const { data } = await axios.get(
      `https://kworb.net/spotify/country/${country}_daily.html`
    )

    const $ = cheerio.load(data)
    const result = []

    $('#spotifydaily tr').each((_, row) => {
      const tds = $(row).find('td')

      if (tds.length < 7) return

      const rankText = tds.eq(0).text().trim()
      if (!rankText || isNaN(Number(rankText))) return

      const totalStream = tds.eq(6).text().trim()

      const links = tds.eq(2).find('a')

      if (links.length < 2) return

      const artistEl = links.eq(0)
      const trackEl = links.eq(1)

      const artistHref = artistEl.attr('href') || ''
      const trackHref = trackEl.attr('href') || ''

      const artistId =
        artistHref.match(/artist\/([^/.]+)\.html/)?.[1] ?? null

      const trackId =
        trackHref.match(/track\/([^/.]+)\.html/)?.[1] ?? null

      const featuredArtists = []

      links.each((index, el) => {
        if (index < 2) return

        const href = $(el).attr('href') || ''

        const id =
          href.match(/artist\/([^/.]+)\.html/)?.[1] ?? null

        featuredArtists.push({
          name: $(el).text().trim(),
          id,
          url: id
            ? `https://open.spotify.com/artist/${id}`
            : null
        })
      })

      result.push({
        rank: Number(rankText),
        artist: {
          name: artistEl.text().trim(),
          id: artistId,
          url: artistId
            ? `https://open.spotify.com/artist/${artistId}`
            : null
        },
        title: {
          name: trackEl.text().trim(),
          id: trackId,
          url: trackId
            ? `https://open.spotify.com/track/${trackId}`
            : null
        },
        featuredArtists,
        totalStream: Number(
          totalStream.replace(/[^\d]/g, '')
        ) || 0
      })
    })

    return {
      status: true,
      description: $('.pagetitle').text().trim(),
      result
    }
  } catch (err) {
    return {
      status: false,
      error: err.message
    }
  }
}

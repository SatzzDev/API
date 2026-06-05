import axios from 'axios'
import * as cheerio from 'cheerio'

export async function SpotifyWeeklyChart(country = 'global') {
  try {
    const { data } = await axios.get(
      `https://kworb.net/spotify/country/${country}_weekly.html`
    )

    const $ = cheerio.load(data)
    const result = []

    const parseNumber = value =>
      Number(String(value).replace(/[^\d-]/g, '')) || 0

    $('#spotifyweekly tr').each((_, row) => {
      const tds = $(row).find('td')

      if (tds.length < 9) return

      const rank = parseNumber(tds.eq(0).text())

      if (!rank) return

      const rankChange = tds.eq(1).text().trim()

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

      const weeksOnChart = parseNumber(tds.eq(3).text())
      const peakPosition = parseNumber(tds.eq(4).text())

      const peakText = tds.eq(5).text().trim()

      const weeksAtPeak =
        peakText.match(/\((?:x)?(\d+)\)/)?.[1]
          ? Number(peakText.match(/\((?:x)?(\d+)\)/)[1])
          : 0

      const weeklyStreams = parseNumber(tds.eq(6).text())
      const streamChange = parseNumber(tds.eq(7).text())
      const totalStreams = parseNumber(tds.eq(8).text())

      result.push({
        rank,
        rankChange,

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

        weeksOnChart,
        peakPosition,
        weeksAtPeak,

        weeklyStreams,
        streamChange,
        totalStreams
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

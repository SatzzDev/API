import axios from 'axios'
import * as cheerio from 'cheerio'

export async function SpotifyDailyChart(country = 'global') {
  try {
    const { data } = await axios.get(
      `https://kworb.net/spotify/country/${country}_weekly.html`
    )

    const $ = cheerio.load(data)
    const songs = []

    $('#spotifydaily tr').each((_, element) => {
      const rank = $(element).find('td').eq(0).text().trim()
      const totalStream = $(element).find('td').eq(6).text().trim()

      if (!rank || isNaN(rank)) return

      const links = $(element).find('td').eq(2).find('a')

      if (links.length < 2) return

      const artistName = $(links[0]).text().trim()
      const artistHref = $(links[0]).attr('href') || ''

      const trackName = $(links[1]).text().trim()
      const trackHref = $(links[1]).attr('href') || ''

      const artistId =
        artistHref.match(/artist\/([^/.]+)\.html/)?.[1] || null

      const trackId =
        trackHref.match(/track\/([^/.]+)\.html/)?.[1] || null

      const featuredArtists = []

      links.slice(2).each((_, el) => {
        const href = $(el).attr('href') || ''
        const id =
          href.match(/artist\/([^/.]+)\.html/)?.[1] || null

        featuredArtists.push({
          name: $(el).text().trim(),
          id,
          url: id
            ? `https://open.spotify.com/artist/${id}`
            : null
        })
      })

      songs.push({
        rank: Number(rank),
        artist: {
          name: artistName,
          id: artistId,
          url: artistId
            ? `https://open.spotify.com/artist/${artistId}`
            : null
        },
        title: {
          name: trackName,
          id: trackId,
          url: trackId
            ? `https://open.spotify.com/track/${trackId}`
            : null
        },
        featuredArtists,
        totalStream: Number(
          totalStream.replace(/,/g, '')
        ) || totalStream
      })
    })

    return {
      status: true,
      developer: 'https://t.me/krniwnstria',
      description: $('.pagetitle').text().trim(),
      songs
    }
  } catch (err) {
    console.error('Error fetching songs:', err)

    return {
      status: false,
      message: err.message
    }
  }
}

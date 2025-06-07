const chromium = require('@sparticuz/chromium')
const puppeteer = require('puppeteer-core')

module.exports = async (req, res) => {
  const { url } = req.body

  if (!url || (!url.includes('twitter.com') && !url.includes('x.com'))) {
    return res.status(400).json({ error: 'Geçersiz tweet URL' })
  }

  const tweetIdMatch = url.match(/status\/(\d+)/)
  const tweetId = tweetIdMatch?.[1]

  if (!tweetId) {
    return res.status(400).json({ error: 'Tweet ID bulunamadı' })
  }

  const tweetUrl = `https://x.com/i/web/status/${tweetId}`

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    await page.goto(tweetUrl, { waitUntil: 'networkidle2' })
    await page.waitForTimeout(3000)

    const tweets = await page.evaluate(() => {
      const tweetDivs = Array.from(document.querySelectorAll('div[data-testid="tweetText"]'))
      return tweetDivs.map(div => div.innerText).filter(Boolean)
    })

    await browser.close()

    const cleaned = tweets.join('\n\n')
    res.status(200).json({ text: cleaned })
  } catch (err) {
    res.status(500).json({ error: 'Flood çekilemedi', detail: err.message })
  }
}

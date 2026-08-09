const stage = process.env.SST_STAGE || "dev"

export default {
  url: stage === "production" ? "https://alphacode.ai" : `https://${stage}.alphacode.ai`,
  console: stage === "production" ? "https://alphacode.ai/auth" : `https://${stage}.alphacode.ai/auth`,
  email: "help@anoma.ly",
  socialCard: "https://social-cards.sst.dev",
  github: "https://github.com/anomalyco/alphacode",
  discord: "https://alphacode.ai/discord",
  headerLinks: [
    { name: "app.header.home", url: "/" },
    { name: "app.header.docs", url: "/docs/" },
  ],
}

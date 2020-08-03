import googleAuth from './googleAuth'
import githubAuth from './githubAuth'

export default {
  isLoggedIn(crowi, req) {
    const { user = {} } = req
    const User = crowi.model('User')
    const isLoggedIn = user && '_id' in user && user.status === User.STATUS_ACTIVE
    return isLoggedIn
  },
  isAccessTokenExpired(req) {
    const { auth = {} } = req.session
    const { expiryDate = null } = auth
    if (expiryDate === null) {
      return false
    }
    const now = new Date().getTime()
    return expiryDate < now
  },
  async reauth(req, crowi) {
    const config = crowi.getConfig()
    const { auth = {} } = req.session
    const { provider = '', accessToken = null, refreshToken = null } = auth
    const authServices = {
      google: googleAuth(crowi, config),
      github: githubAuth(crowi, config),
    }
    const providers = [authServices.google.PROVIDER, authServices.github.PROVIDER]
    if (providers.includes(provider)) {
      const authService = authServices[provider]
      const serviceId = req.user[provider + 'Id']
      const { success, tokens } = await authService.reauth(serviceId, { accessToken, refreshToken })
      if (success) {
        this.saveTokenToSession(req, provider, tokens)
      }
      return success
    }
    return false
  },
  saveTokenToSession(
    req,
    provider = '',
    { accessToken = null, refreshToken = null, expiryDate = null }: { accessToken: string | null; refreshToken: string | null; expiryDate: number | null },
  ) {
    expiryDate = expiryDate || new Date().getTime() + 60 * 60 * 1000
    req.session.auth = { provider, accessToken, refreshToken, expiryDate }
  },
}

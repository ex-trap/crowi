import { Router, Express } from 'express'
import Crowi from 'server/crowi'
const router = Router()

export default (crowi: Crowi, app: Express, form) => {
  const { Me } = crowi.controllers
  const { Disabled, LoginRequired } = crowi.middlewares

  router.use('/me*', LoginRequired)

  router.get('/me', Disabled('/me/notifications'), Me.index)
  router.get('/me/password', Disabled(), Me.password)
  router.get('/me/apiToken', Me.apiToken)
  router.get('/me/auth/third-party', Disabled(), Me.authThirdParty)
  router.post('/me', Disabled(), form.me.user, Me.index)
  router.post('/me/password', Disabled(), form.me.password, Me.password)
  router.post('/me/apiToken', form.me.apiToken, Me.apiToken)
  router.get('/me/notifications', Me.notifications)
  router.post('/me/picture/delete', Disabled(), Me.deletePicture)
  router.post('/me/auth/google', Disabled(), Me.authGoogle)
  router.get('/me/auth/google/callback', Disabled(), Me.authGoogleCallback)
  router.post('/me/auth/github', Disabled(), Me.authGitHub)
  router.get('/me/auth/github/callback', Disabled(), Me.authGitHubCallback)

  return router
}

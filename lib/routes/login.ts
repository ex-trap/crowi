import { Router, Express } from 'express'
import Crowi from 'server/crowi'
const router = Router()

export default (crowi: Crowi, app: Express, form) => {
  const { Login, LoginWithTraq } = crowi.controllers
  const { ApplicationInstalled, CsrfVerify: csrf, Disabled } = crowi.middlewares

  router.get('/login/error/:reason', Login.error)
  router.get('/login', LoginWithTraq.auth)
  router.get('/login/callback', LoginWithTraq.auth, LoginWithTraq.callback)
  router.get('/register', Disabled(), ApplicationInstalled, Login.register)
  router.get('/login/invited', Disabled(), Login.invited)
  router.post('/login/activateInvited', Disabled(), form.invited, csrf, Login.invited)
  router.post('/login', Disabled(), form.login, csrf, Login.login)
  router.get('/login/google', Disabled(), Login.loginGoogle)
  router.get('/login/github', Disabled(), Login.loginGitHub)

  return router
}

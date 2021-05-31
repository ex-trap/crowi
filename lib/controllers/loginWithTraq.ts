import axios from 'axios'
import crypto from 'crypto'
import Debug from 'debug'
import { Request, Response } from 'express'
import passport from 'passport'
import { Strategy as OAuth2Strategy } from 'passport-oauth2'
import Crowi from 'server/crowi'
import { UserDocument } from 'server/models/user'
import { getContinueUrl } from 'server/util/url'

export default (crowi: Crowi) => {
  const debug = Debug('crowi:routes:login:traQ')
  const User = crowi.model('User')
  const actions = {} as any

  const traqUrl = process.env.TRAQ_URL
  const oauthClient = {
    authorizationURL: `${traqUrl}/api/v3/oauth2/authorize`,
    tokenURL: `${traqUrl}/api/v3/oauth2/token`,
    clientID: process.env.TRAQ_CLIENT_ID,
    clientSecret: process.env.TRAQ_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/login/callback`,
  }

  passport.use(
    new OAuth2Strategy(oauthClient, async (accessToken, _refreshToken, _profile, callback) => {
      try {
        debug('obtained token:', accessToken.replace(/(?<=^.{8,})./g, '_'))

        const {
          data: { name, displayName },
        } = await axios.get(`${traqUrl}/api/v3/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        debug('obtained user name:', name)

        await axios.post(`${traqUrl}/api/v3/oauth2/revoke`, {
          token: accessToken,
        })
        debug('revoked token:', accessToken)

        callback(null, { username: name, name: displayName })
      } catch (err) {
        debug('sync userinfo failed:', err)
        callback(err, null)
      }
    }),
  )

  const loginSuccess = async function (req: Request, res: Response, userData: UserDocument) {
    userData = await userData.populateSecrets()
    req.user = req.session.user = userData
    return res.redirect(getContinueUrl(req))
  }

  const loginFailure = function (req: Request, res: Response, message: string) {
    debug('failed to login:', message)
    return res.redirect('/login/error/unknown')
  }

  actions.auth = passport.authenticate('oauth2', { session: false })
  actions.callback = async function (req: Request, res: Response) {
    const username = req.user?.username
    if (!username) {
      return loginFailure(req, res, 'no username in req.user')
    }

    const syncedData = {
      name: req.user?.name || username,
      lang: 'ja',
      email: '-',
      password: crypto.randomBytes(64),
      image: `${traqUrl}/api/v3/public/icon/${username}`,
    }

    let userData = await User.findUserByUsername(username).catch((err) => {
      debug('error on findUserByUsername', err)
    })
    if (!userData) {
      debug('creating new user:', username)
      userData = await new Promise((resolve) => {
        User.createUserByEmailAndPassword(syncedData.name, username, syncedData.email, syncedData.password, syncedData.lang, (err, userData) => {
          if (err) {
            debug('user creation failed:', err)
            return resolve(null)
          }
          return resolve(userData)
        })
      })
    }
    if (!userData) {
      return loginFailure(req, res, `cannot find or create such user, ${username}`)
    }

    Object.assign(userData, syncedData)
    return loginSuccess(req, res, await userData.save())
  }

  return actions
}

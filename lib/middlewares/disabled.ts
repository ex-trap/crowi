import { Request, Response } from 'express'

export default () => {
  return (alternative = '') => (req: Request, res: Response, next) => {
    if (alternative === '') {
      return res.status(404).send('This page is disabled!')
    }
    return res.redirect(302, alternative)
  }
}

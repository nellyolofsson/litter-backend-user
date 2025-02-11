import { AuthController } from './AuthController.js'
import { AuthService } from '../services/AuthService.js'
import { sendToRabbitMQ } from '../config/rabbitmq.js'
import nodemailer from 'nodemailer'

jest.mock('../services/AuthService.js')
jest.mock('../config/rabbitmq.js')
jest.mock('nodemailer')

describe('AuthController', () => {
  let authController
  let authServiceMock

  beforeEach(() => {
    authServiceMock = new AuthService()
    authController = new AuthController(authServiceMock)
  })

  describe('loginWithGoogle', () => {
    it('should redirect to localhost if user is authenticated', async () => {
      const req = { user: true }
      const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      }
      const next = jest.fn()

      await authController.loginWithGoogle(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000')
    })

    it('should send 401 if authentication failed', async () => {
      const req = { user: false }
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() }
      const next = jest.fn()

      await authController.loginWithGoogle(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.send).toHaveBeenCalledWith('Authentication failed')
    })
  })

  describe('loginSuccess', () => {
    it('should return user data if authenticated', async () => {
      const req = { /**
                     *
                     */
        isAuthenticated: () => true, user: { id: 1, name: 'Test User' }
      }
      const res = { json: jest.fn() }
      const next = jest.fn()

      await authController.loginSuccess(req, res, next)

      expect(res.json).toHaveBeenCalledWith(req.user)
    })

    it('should return 401 if not authenticated', async () => {
      const req = { /**
                     *
                     */
        isAuthenticated: () => false
      }
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const next = jest.fn()

      await authController.loginSuccess(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })
  })

  describe('getOneUser', () => {
    it('should return user data by id', async () => {
      const req = { params: { id: 1 } }
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const next = jest.fn()

      const mockUser = { id: 1, name: 'Test User' }
      authServiceMock.findOne = jest.fn().mockResolvedValue(mockUser)

      await authController.getOneUser(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockUser)
    })

    it('should return 404 if user is not found', async () => {
      const req = { params: { id: 1 } }
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const next = jest.fn()

      authServiceMock.findOne = jest.fn().mockResolvedValue(null)

      await authController.getOneUser(req, res, next)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
    })
  })

  describe('checkFollowers', () => {
    it('should update followers if not following', async () => {
      const req = {
        params: { id: 1 },
        body: { user: { id: 2, firstName: 'John', lastName: 'Doe', profilePhoto: 'photo' } }
      }
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const next = jest.fn()

      const mockUser = { id: 1, followers: [] }
      const mockFollowingUser = { id: 2, following: [] }
      authServiceMock.findOne = jest.fn().mockResolvedValueOnce(mockUser).mockResolvedValueOnce(mockFollowingUser)
      authServiceMock.updateOrReplaceUser = jest.fn().mockResolvedValue(mockUser)

      await authController.checkFollowers(req, res, next)

      expect(authServiceMock.updateOrReplaceUser).toHaveBeenCalledTimes(2)
      expect(sendToRabbitMQ).toHaveBeenCalled()
      expect(nodemailer.createTransport().sendMail).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockUser)
    })

    it('should return 404 if user not found', async () => {
      const req = { params: { id: 1 }, body: { user: { id: 999 } } }
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const next = jest.fn()

      authServiceMock.findOne = jest.fn().mockResolvedValue(null)

      await authController.checkFollowers(req, res, next)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
    })
  })

  describe('sendEmail', () => {
    it('should send email notification', async () => {
      const followerUser = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
      const followingUser = { email: 'followed@example.com' }

      nodemailer.createTransport().sendMail = jest.fn().mockResolvedValue('Email sent')

      await authController.sendEmail(followerUser, followingUser)

      expect(nodemailer.createTransport().sendMail).toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('should logout user and redirect', async () => {
      const req = { logout: jest.fn((cb) => cb()), session: { destroy: jest.fn() } }
      const res = { clearCookie: jest.fn(), redirect: jest.fn() }
      const next = jest.fn()

      await authController.logout(req, res, next)

      expect(req.logout).toHaveBeenCalled()
      expect(res.clearCookie).toHaveBeenCalledWith('connect.sid')
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000')
    })
  })
})

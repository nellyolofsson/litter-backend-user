// User-land modules.
import { Container, decorate, inject, injectable } from 'inversify'
import 'reflect-metadata'

// Application modules.
import { AuthController } from '../controllers/AuthController.js'
import { UserModel } from '../models/UserModel.js'
import { MongooseRepositoryBase } from '../repositories/MongooseRepositoryBase.js'
import { AuthRepository } from '../repositories/AuthRepository.js'
import { MongooseServiceBase } from '../services/MongooseServiceBase.js'
import { AuthService } from '../services/AuthService.js'

// Define the types to be used by the IoC container.
export const USERTYPES = {
  AuthController: Symbol.for('AuthController'),
  AuthRepository: Symbol.for('AuthRepository'),
  AuthService: Symbol.for('AuthService'),
  UserModelClass: Symbol.for('UserModelClass')
}

// Declare the injectable and its dependencies.
decorate(injectable(), MongooseRepositoryBase)
decorate(injectable(), MongooseServiceBase)
decorate(injectable(), AuthRepository)
decorate(injectable(), AuthService)
decorate(injectable(), AuthController)

decorate(inject(USERTYPES.AuthService), AuthController, 0)
decorate(inject(USERTYPES.UserModelClass), AuthRepository, 0)

decorate(inject(USERTYPES.AuthRepository), AuthService, 0)

// Create the IoC container.
export const container = new Container()

container.bind(USERTYPES.AuthController).to(AuthController).inSingletonScope()
container.bind(USERTYPES.AuthRepository).to(AuthRepository).inSingletonScope()
container.bind(USERTYPES.AuthService).to(AuthService).inSingletonScope()
container.bind(USERTYPES.UserModelClass).toConstantValue(UserModel)

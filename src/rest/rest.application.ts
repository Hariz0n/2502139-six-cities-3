import { inject } from 'inversify';
import { injectable } from 'inversify';
import { Component } from '../shared/types/index.js';
import { Logger } from '../shared/libs/logger/index.js';
import { Config, RestSchema } from '../shared/libs/config/index.js';
import { DatabaseClient } from '../shared/libs/database-client/index.js';
import { getMongoURI } from '../shared/helpers/index.js';
import express, { Express } from 'express';
import { Controller } from '../shared/libs/rest/index.js';

@injectable()
export class RestApplication {
  private server: Express;

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config<RestSchema>,
    @inject(Component.DatabaseClient) private readonly databaseClient: DatabaseClient,
    @inject(Component.OfferController) private readonly offerController: Controller,
  ) {
    this.server = express();
  }

  private async _initDb() {
    const mongoUri = getMongoURI(
      this.config.get('DB_USER'),
      this.config.get('DB_PASSWORD'),
      this.config.get('DB_HOST'),
      this.config.get('DB_PORT'),
      this.config.get('DB_NAME')
    );

    return this.databaseClient.connect(mongoUri);
  }

  private async _initMiddleware() {
    this.server.use(express.json());
  }

  private async _initControllers() {
    this.server.use('/offers', this.offerController.router);
  }

  private async _initServer() {
    const port = this.config.get('PORT');
    this.server.listen(port);
  }

  public async init() {
    this.logger.info('Приложение инициализировано');

    this.logger.info('Инициализация базы данных...');
    await this._initDb();
    this.logger.info('База данных инициализирована');

    this.logger.info('Инициализация middleware приложения...');
    await this._initMiddleware();
    this.logger.info('Инициализация middleware приложения завершена');

    this.logger.info('Инициализация контроллеров...');
    await this._initControllers();
    this.logger.info('Инициализация контроллеров завершена');

    this.logger.info('Инициализация сервера Express...');
    await this._initServer();
    this.logger.info(`Сервер Express успешно запущен по адресу http://localhost:${this.config.get('PORT')}`);
  }
}

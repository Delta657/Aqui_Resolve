import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { AuthMiddleware } from './middleware/authMiddleware';

class App {
  public app: express.Application;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.app = express();
    this.authMiddleware = new AuthMiddleware();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Middleware de segurança
    this.app.use(helmet());
    
    // Middleware de CORS
    this.app.use(cors({
      origin: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Middleware de logging
    this.app.use(morgan('combined'));

    // Middleware para parsing de JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Middleware para mascarar emails nas respostas
    this.app.use(this.authMiddleware.maskEmailInResponse.bind(this.authMiddleware));
  }

  private initializeRoutes(): void {
    // Rotas da API
    this.app.use('/', routes);
  }

  private initializeErrorHandling(): void {
    // Middleware para tratamento de erros
    this.app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Erro na aplicação:', err);

      // Se o erro já foi tratado, não fazer nada
      if (res.headersSent) {
        return next(err);
      }

      // Determinar o status code
      const statusCode = err.statusCode || err.status || 500;
      const message = err.message || 'Erro interno do servidor';

      // Log do erro
      console.error(`Erro ${statusCode}: ${message}`);
      console.error(err.stack);

      // Resposta de erro
      res.status(statusCode).json({
        success: false,
        message: process.env['NODE_ENV'] === 'production' ? 'Erro interno do servidor' : message,
        ...(process.env['NODE_ENV'] !== 'production' && { stack: err.stack })
      });
    });

    // Middleware para capturar erros não tratados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`🚀 Servidor rodando na porta ${port}`);
      console.log(`📊 Ambiente: ${process.env['NODE_ENV'] || 'development'}`);
      console.log(`🔗 URL: http://localhost:${port}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default App;

import { AppModule } from './AppModule';
import { IndexerServerApp } from './IndexerServerApp';

async function bootstrap() {
  const app = new IndexerServerApp(AppModule);
  await app.start();
}

void bootstrap();

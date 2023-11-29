import { AppModule } from "./AppModule";
import { OrdexerServerApp } from "./OrdexerServerApp";

async function bootstrap() {
  const app = new OrdexerServerApp(AppModule);
  await app.start();
}

void bootstrap();

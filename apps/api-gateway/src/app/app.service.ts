// Ruta de archivo: PlataformaEncuentroNestJS/apps/api-gateway/src/app/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}

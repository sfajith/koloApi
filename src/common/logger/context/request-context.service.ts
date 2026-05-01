import { Injectable } from '@nestjs/common';
import { createNamespace } from 'cls-hooked';

const NAMESPACE = 'request';

@Injectable()
export class RequestContextService {
  private readonly namespace = createNamespace(NAMESPACE);

  run(callback: () => void) {
    this.namespace.run(callback);
  }

  set(key: string, value: any) {
    this.namespace.set(key, value);
  }

  get<T>(key: string): T {
    return this.namespace.get(key);
  }
}

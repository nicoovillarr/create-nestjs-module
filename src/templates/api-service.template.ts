import { Injectable } from '@nestjs/common';

import { $ModuleName$Service } from '$BaseDir$/domain/services/$ModuleNameKebab$.service';

@Injectable()
export class $ModuleName$ApiService {
  constructor(private readonly $ModuleNameCamel$Service: $ModuleName$Service) {}
}

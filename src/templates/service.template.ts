import { Inject, Injectable } from '@nestjs/common';

import { $ModuleNameSnakeUpper$_REPOSITORY_SYMBOL } from '$BaseDir$/domain/repositories/$ModuleNameKebab$.repository';
import { type $ModuleName$Repository } from '$BaseDir$/domain/repositories/$ModuleNameKebab$.repository';

@Injectable()
export class $ModuleName$Service {
  constructor(
    @Inject($ModuleNameSnakeUpper$_REPOSITORY_SYMBOL)
    private readonly $ModuleNameCamel$Repository: $ModuleName$Repository
  ) {}
}

import { Controller, Get } from '@nestjs/common';

import { $ModuleName$ApiService } from '$BaseDir$/application/$ModuleNameKebab$-api.service';

@Controller('$ModuleNameKebab$')
export class $ModuleName$Controller {
  constructor(private readonly $ModuleNameCamel$ApiService: $ModuleName$ApiService) {}

  @Get()
  hello() {
    return 'Hello from $ModuleName$Controller';
  }
}

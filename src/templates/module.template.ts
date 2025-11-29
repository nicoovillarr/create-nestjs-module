import { Module } from '@nestjs/common';

import { $ModuleName$ApiService } from '$BaseDir$/application/$ModuleNameKebab$-api.service';
import { $ModuleName$Service } from '$BaseDir$/domain/services/$ModuleNameKebab$.service';
import { $ModuleName$Controller } from '$BaseDir$/presentation/controllers/$ModuleNameKebab$.controller';

@Module({
  controllers: [$ModuleName$Controller],
  providers: [$ModuleName$ApiService, $ModuleName$Service],
})
export class $ModuleName$Module {}

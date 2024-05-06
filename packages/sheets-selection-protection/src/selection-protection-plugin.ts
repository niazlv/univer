/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ICommandService, Plugin, UniverInstanceType } from '@univerjs/core';
import type { Dependency } from '@wendellhu/redi';
import { Inject, Injector } from '@wendellhu/redi';
import { SelectionProtectionRenderModel } from './model/selection-protection-render.model';
import { SelectionProtectionRuleModel } from './model/selection-protection-rule.model';
import { SelectionProtectionService } from './service/selection-protection/selection-protection.service';
import { ISelectionPermissionIoService } from './service/selection-permission-io/type';
import { SelectionPermissionIoService } from './service/selection-permission-io/selection-permission-io.service';
import { AddSelectionProtection } from './commands/mutation/add-selection-protection.mutation';
import { DeleteSelectionProtection } from './commands/mutation/delete-selection-protection.mutation';
import { SetSelectionProtection } from './commands/mutation/set-selection-protection';
import { PLUGIN_NAME } from './base/const';
import { SelectionProtectionRenderService } from './service/selection-protection-render.service';

export class UniverSheetsSelectionProtectionPlugin extends Plugin {
    static override type = UniverInstanceType.UNIVER_SHEET;
    static override pluginName = PLUGIN_NAME;

    static readonly dependencyList: Dependency[] = [[SelectionProtectionRenderModel], [SelectionProtectionRuleModel], [SelectionProtectionRenderService], [SelectionProtectionService], [ISelectionPermissionIoService, { useClass: SelectionPermissionIoService }]];
    static readonly mutationList = [AddSelectionProtection, DeleteSelectionProtection, SetSelectionProtection];

    constructor(
        _config: unknown,
        @Inject(Injector) override readonly _injector: Injector,
        @Inject(ICommandService) private _commandService: ICommandService

    ) {
        super();
        this._initCommand();
    }

    override onStarting(): void {
        UniverSheetsSelectionProtectionPlugin.dependencyList.forEach((d) => {
            this._injector.add(d);
        });
    }

    _initCommand() {
        UniverSheetsSelectionProtectionPlugin.mutationList.forEach((m) => {
            this._commandService.registerCommand(m);
        });
        (window as any).commandService = this._commandService;
    }
}

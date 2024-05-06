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

import { ICommandService, LocaleService, Plugin, UniverInstanceType } from '@univerjs/core';
import { type Dependency, Inject, Injector } from '@wendellhu/redi';
import { UNIVER_SHEET_PERMISSION_PLUGIN_NAME } from './const';
import { SheetPermissionRenderController } from './controller/sheet-permission-render.controller';
import { enUS, zhCN } from './locale';
import { SheetPermissionOpenPanelOperation } from './operation/sheet-permission-open-panel.operation';
import { SheetPermissionPanelService, SheetPermissionUserManagerService } from './service';
import { AddSheetPermissionCommand, AddSheetPermissionFromContextMenuCommand, AddSheetPermissionFromSheetBarCommand, ChangeSheetPermissionFromSheetBarCommand, DeleteSheetPermissionCommand, deleteSheetPermissionFromContextMenuCommand, SetSheetPermissionCommand, SetSheetPermissionFromContextMenuCommand, ViewSheetPermissionFromContextMenuCommand, ViewSheetPermissionFromSheetBarCommand } from './command/sheet-permission.command';
import { SheetPermissionOpenDialogOperation } from './operation/sheet-permission-open-dialog.operation';

export class UniverSheetsPermissionUIPlugin extends Plugin {
    static override pluginName = UNIVER_SHEET_PERMISSION_PLUGIN_NAME;
    static override type = UniverInstanceType.UNIVER;

    constructor(
        _config: unknown,
        @Inject(Injector) protected _injector: Injector,
        @ICommandService private readonly _commandService: ICommandService,
        @Inject(LocaleService) private readonly _localeService: LocaleService
    ) {
        super();
    }

    override onStarting(injector: Injector) {
        ([
            [SheetPermissionPanelService],
            [SheetPermissionUserManagerService],
            [SheetPermissionRenderController],
        ] as Dependency[]).forEach((dep) => {
            injector.add(dep);
        });

        [
            SheetPermissionOpenPanelOperation,
            SheetPermissionOpenDialogOperation,

            AddSheetPermissionFromContextMenuCommand,
            ViewSheetPermissionFromContextMenuCommand,
            AddSheetPermissionFromSheetBarCommand,
            ViewSheetPermissionFromSheetBarCommand,
            ChangeSheetPermissionFromSheetBarCommand,
            deleteSheetPermissionFromContextMenuCommand,
            SetSheetPermissionFromContextMenuCommand,
            AddSheetPermissionCommand,
            DeleteSheetPermissionCommand,
            SetSheetPermissionCommand,
        ].forEach((command) => {
            this._commandService.registerCommand(command);
        });

        this._localeService.load({
            zhCN,
            enUS,
        });
    }
}

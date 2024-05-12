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
import { SelectionProtectionRenderService } from '@univerjs/sheets-selection-protection';
import { UNIVER_SHEET_PERMISSION_PLUGIN_NAME } from './const';
import { SheetPermissionRenderController } from './controller/sheet-permission-render.controller';
import { enUS, zhCN } from './locale';
import { SheetPermissionOpenPanelOperation } from './operation/sheet-permission-open-panel.operation';
import { SheetPermissionUserManagerService } from './service';
import { AddRangeProtectionFromContextMenuCommand, AddRangeProtectionFromSheetBarCommand, AddRangeProtectionFromToolbarCommand, DeleteRangeProtectionFromContextMenuCommand, SetRangeProtectionFromContextMenuCommand, ViewSheetPermissionFromContextMenuCommand, ViewSheetPermissionFromSheetBarCommand } from './command/range-protection.command';
import { SheetPermissionOpenDialogOperation } from './operation/sheet-permission-open-dialog.operation';
import { AddWorksheetProtectionCommand, ChangeSheetProtectionFromSheetBarCommand, DeleteWorksheetProtectionCommand, SetWorksheetProtectionCommand } from './command/worksheet-protection.command';
import { SheetPermissionPanelModel } from './service/sheet-permission-panel.model';

export class UniverSheetsPermissionUIPlugin extends Plugin {
    static override pluginName = UNIVER_SHEET_PERMISSION_PLUGIN_NAME;
    static override type = UniverInstanceType.UNIVER_SHEET;

    constructor(
        _config: unknown,
        @Inject(Injector) protected _injector: Injector,
        @ICommandService private readonly _commandService: ICommandService,
        @Inject(LocaleService) private readonly _localeService: LocaleService
    ) {
        super();
    }

    override onStarting() {
        ([
            [SheetPermissionPanelModel],

            [SheetPermissionUserManagerService],

            [SheetPermissionRenderController],
            [SelectionProtectionRenderService],
        ] as Dependency[]).forEach((dep) => {
            this._injector.add(dep);
        });

        [
            SheetPermissionOpenPanelOperation,
            SheetPermissionOpenDialogOperation,
            AddRangeProtectionFromToolbarCommand,
            AddRangeProtectionFromContextMenuCommand,
            ViewSheetPermissionFromContextMenuCommand,
            AddRangeProtectionFromSheetBarCommand,
            ViewSheetPermissionFromSheetBarCommand,
            ChangeSheetProtectionFromSheetBarCommand,
            DeleteRangeProtectionFromContextMenuCommand,
            SetRangeProtectionFromContextMenuCommand,
            AddWorksheetProtectionCommand,
            DeleteWorksheetProtectionCommand,
            SetWorksheetProtectionCommand,
        ].forEach((command) => {
            this._commandService.registerCommand(command);
        });

        this._localeService.load({
            zhCN,
            enUS,
        });
    }
}

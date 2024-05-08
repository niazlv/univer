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

import type { ICellDataForSheetInterceptor, ICommandInfo, IPermissionTypes, IRange, Workbook } from '@univerjs/core';
import { Disposable, ICommandService, IUniverInstanceService, LifecycleStages, OnLifecycle, RangeUnitPermissionType, SubUnitPermissionType, UniverInstanceType } from '@univerjs/core';
import { InsertCommand } from '@univerjs/docs';
import type { GetWorkbookPermissionFunc, GetWorksheetPermission } from '@univerjs/sheets';
import { SelectionManagerService, SetBackgroundColorCommand, WorkbookPermissionService, WorksheetPermissionService } from '@univerjs/sheets';
import { Inject } from '@wendellhu/redi';
import { IDialogService } from '@univerjs/ui';
import { UNIVER_SHEET_PERMISSION_ALERT_DIALOG, UNIVER_SHEET_PERMISSION_ALERT_DIALOG_ID } from '@univerjs/sheets-permission-ui';

import { SetCellEditVisibleOperation } from '../commands/operations/cell-edit.operation';
import { SetRangeBoldCommand, SetRangeItalicCommand, SetRangeStrickThroughCommand, SetRangeUnderlineCommand } from '../commands/commands/inline-format.command';

type ICellPermission = Record<RangeUnitPermissionType, boolean> & { ruleId?: string; ranges?: IRange[] };

@OnLifecycle(LifecycleStages.Rendered, SheetPermissionController)
export class SheetPermissionController extends Disposable {
    constructor(
        @ICommandService private readonly _commandService: ICommandService,
        @Inject(IUniverInstanceService) private readonly _univerInstanceService: IUniverInstanceService,
        @Inject(WorkbookPermissionService) private readonly _workbookPermissionService: WorkbookPermissionService,
        @Inject(WorksheetPermissionService) private readonly _worksheetPermissionService: WorksheetPermissionService,
        @Inject(SelectionManagerService) private readonly _selectionManagerService: SelectionManagerService,
        @Inject(IDialogService) private readonly _dialogService: IDialogService
    ) {
        super();
        this._initialize();
    }

    private _haveNotPermissionHandle() {
        this._dialogService.open({
            id: UNIVER_SHEET_PERMISSION_ALERT_DIALOG_ID,
            title: { title: '' },
            children: { label: UNIVER_SHEET_PERMISSION_ALERT_DIALOG },
            width: 320,
            destroyOnClose: true,
            onClose: () => this._dialogService.close(UNIVER_SHEET_PERMISSION_ALERT_DIALOG_ID),
            className: 'sheet-permission-user-dialog',
        });
        throw new Error('have not permission');
    }

    private _getPermissionCheck(id: string) {
        let permission = true;
        switch (id) {
            case InsertCommand.id:
            case SetCellEditVisibleOperation.id:
                permission = this._permissionCheckWithoutRange({
                    rangeType: RangeUnitPermissionType.Edit,
                    worksheetType: [SubUnitPermissionType.Edit],
                });
                break;

            case SetBackgroundColorCommand.id:
            case SetRangeBoldCommand.id:
            case SetRangeItalicCommand.id:
            case SetRangeUnderlineCommand.id:
            case SetRangeStrickThroughCommand.id:
                permission = this._permissionCheckWithRanges({
                    rangeType: RangeUnitPermissionType.Edit,
                });
                break;
            default:
                break;
        }

        if (!permission) {
            this._haveNotPermissionHandle();
        }
    };

    private _initialize(): void {
        this._commandExecutedListener();
    }

    private _commandExecutedListener() {
        this.disposeWithMe(
            this._commandService.beforeCommandExecuted((command: ICommandInfo) => {
                this._getPermissionCheck(command.id);
            })
        );
    }

    private _permissionCheckWithoutRange(permissionTypes: IPermissionTypes) {
        const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
        const worksheet = workbook?.getActiveSheet();
        const selection = this._selectionManagerService.getLast();
        const row = selection?.primary?.actualRow ?? 0;
        const col = selection?.primary?.actualColumn ?? 0;
        const { workbookType, worksheetType, rangeType } = permissionTypes;
        if (workbookType) {
            const workbookDisable = workbookType.some((type) => {
                const workbookPermissionCheckFnName = `get${workbookType}Permission` as keyof WorkbookPermissionService;
                const workbookPermissionCheckFn = this._workbookPermissionService[workbookPermissionCheckFnName] as GetWorkbookPermissionFunc;
                const workbookPermission = workbookPermissionCheckFn(workbook.getUnitId());
                if (workbookPermission === false) {
                    return true;
                } else {
                    return false;
                }
            });
            if (workbookDisable === true) {
                return false;
            }
        }
        if (worksheetType) {
            const worksheetDisable = worksheetType.some((type) => {
                const worksheetPermissionCheckFnName = `get${worksheetType}Permission` as keyof WorksheetPermissionService;
                const worksheetPermissionCheckFn = this._worksheetPermissionService[worksheetPermissionCheckFnName] as GetWorksheetPermission;
                const worksheetPermission = worksheetPermissionCheckFn({
                    unitId: workbook.getUnitId(),
                    subUnitId: worksheet.getSheetId(),
                });
                if (worksheetPermission === false) {
                    return true;
                } else {
                    return false;
                }
            });
            if (worksheetDisable === true) {
                return false;
            }
        }
        if (rangeType) {
            const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
            if (permission?.[rangeType] === false) {
                return false;
            }
        }
        return true;
    }

    private _permissionCheckWithRanges(permissionTypes: IPermissionTypes) {
        const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
        const worksheet = workbook?.getActiveSheet();
        const ranges = this._selectionManagerService.getSelections()?.map((selection) => {
            return selection.range;
        });

        if (!ranges) {
            return false;
        }

        const { workbookType, worksheetType, rangeType } = permissionTypes;
        if (workbookType) {
            const workbookDisable = workbookType.some((type) => {
                const workbookPermissionCheckFnName = `get${workbookType}Permission` as keyof WorkbookPermissionService;
                const workbookPermissionCheckFn = this._workbookPermissionService[workbookPermissionCheckFnName] as GetWorkbookPermissionFunc;
                const workbookPermission = workbookPermissionCheckFn(workbook.getUnitId());
                if (workbookPermission === false) {
                    return true;
                } else {
                    return false;
                }
            });
            if (workbookDisable === true) {
                return false;
            }
        }
        if (worksheetType) {
            const worksheetDisable = worksheetType.some((type) => {
                const worksheetPermissionCheckFnName = `get${worksheetType}Permission` as keyof WorksheetPermissionService;
                const worksheetPermissionCheckFn = this._worksheetPermissionService[worksheetPermissionCheckFnName] as GetWorksheetPermission;
                const worksheetPermission = worksheetPermissionCheckFn({
                    unitId: workbook.getUnitId(),
                    subUnitId: worksheet.getSheetId(),
                });
                if (worksheetPermission === false) {
                    return true;
                } else {
                    return false;
                }
            });
            if (worksheetDisable === true) {
                return false;
            }
        }

        if (rangeType) {
            const hasPermission = ranges?.every((range) => {
                for (let row = range.startRow; row <= range.endRow; row++) {
                    for (let col = range.startColumn; col <= range.endColumn; col++) {
                        const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
                        if (permission?.[rangeType] === false) {
                            return false;
                        }
                    }
                }
                return true;
            });
            return hasPermission;
        }

        return true;
    }
}

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
import { Disposable, IAuthzIoService, ICommandService, IPermissionService, IUniverInstanceService, LifecycleStages, mapPermissionPointToSubEnum, OnLifecycle, RangeUnitPermissionType, SubUnitPermissionType, UniverInstanceType } from '@univerjs/core';
import { InsertCommand } from '@univerjs/docs';
import type { GetWorkbookPermissionFunc, GetWorksheetPermission } from '@univerjs/sheets';
import { defaultWorksheetPermissionPoint, DeltaColumnWidthCommand, DeltaRowHeightCommand, getAllWorksheetPermissionPoint, SelectionManagerService, SetBackgroundColorCommand, SetRangeValuesMutation, WorkbookPermissionService, WorksheetPermissionService, WorksheetProtectionRuleModel } from '@univerjs/sheets';
import { Inject } from '@wendellhu/redi';
import { IDialogService } from '@univerjs/ui';
import { UNIVER_SHEET_PERMISSION_ALERT_DIALOG, UNIVER_SHEET_PERMISSION_ALERT_DIALOG_ID } from '@univerjs/sheets-permission-ui';

import { getAllRangePermissionPoint, SelectionProtectionRuleModel } from '@univerjs/sheets-selection-protection';
import { UnitAction, UnitObject, UniverType } from '@univerjs/protocol';
import { SetCellEditVisibleOperation } from '../commands/operations/cell-edit.operation';
import { SetRangeBoldCommand, SetRangeItalicCommand, SetRangeStrickThroughCommand, SetRangeUnderlineCommand } from '../commands/commands/inline-format.command';
import { SheetCopyCommand } from '../commands/commands/clipboard.command';
import { ApplyFormatPainterCommand } from '../commands/commands/set-format-painter.command';

type ICellPermission = Record<RangeUnitPermissionType, boolean> & { ruleId?: string; ranges?: IRange[] };

@OnLifecycle(LifecycleStages.Rendered, SheetPermissionController)
export class SheetPermissionController extends Disposable {
    constructor(
        @ICommandService private readonly _commandService: ICommandService,
        @Inject(IUniverInstanceService) private readonly _univerInstanceService: IUniverInstanceService,
        @Inject(WorkbookPermissionService) private readonly _workbookPermissionService: WorkbookPermissionService,
        @Inject(WorksheetPermissionService) private readonly _worksheetPermissionService: WorksheetPermissionService,
        @Inject(SelectionManagerService) private readonly _selectionManagerService: SelectionManagerService,
        @Inject(IDialogService) private readonly _dialogService: IDialogService,
        @Inject(IPermissionService) private _permissionService: IPermissionService,
        @Inject(IAuthzIoService) private authzIoService: IAuthzIoService,
        @Inject(SelectionProtectionRuleModel) private _selectionProtectionRuleModel: SelectionProtectionRuleModel,
        @Inject(WorksheetProtectionRuleModel) private _worksheetProtectionRuleModel: WorksheetProtectionRuleModel
    ) {
        super();
        this._initialize();
        this._initRangePermissionFromSnapshot();
        this._initRangePermissionChange();
        this._initWorksheetPermissionFromSnapshot();
        this._initWorksheetPermissionChange();
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
                    worksheetType: [SubUnitPermissionType.SetCellValue],
                });
                break;
            case SetRangeValuesMutation.id:
            case ApplyFormatPainterCommand.id:
                permission = this._permissionCheckWithRanges({
                    rangeType: RangeUnitPermissionType.Edit,
                    worksheetType: [SubUnitPermissionType.SetCellValue, SubUnitPermissionType.SetCellStyle],
                });
                break;
            case SetBackgroundColorCommand.id:
            case SetRangeBoldCommand.id:
            case SetRangeItalicCommand.id:
            case SetRangeUnderlineCommand.id:
            case SetRangeStrickThroughCommand.id:
                permission = this._permissionCheckWithRanges({
                    rangeType: RangeUnitPermissionType.Edit,
                    worksheetType: [SubUnitPermissionType.SetCellStyle],
                });
                break;
            case SheetCopyCommand.id:
                permission = this._permissionCheckWithRanges({
                    rangeType: RangeUnitPermissionType.View,
                    worksheetType: [SubUnitPermissionType.Copy],
                });
                break;
            case DeltaColumnWidthCommand.id:
            case DeltaRowHeightCommand.id:
                permission = this._permissionCheckWithoutRange({
                    worksheetType: [SubUnitPermissionType.RowHeightColWidth],
                });
                break;

            // move range; move row col 需要对两个选区进行判断

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
                const workbookPermissionCheckFnName = `get${type}Permission` as keyof WorkbookPermissionService;
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
                const worksheetPermissionCheckFnName = `get${type}Permission` as keyof WorksheetPermissionService;
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
                const workbookPermissionCheckFnName = `get${type}Permission` as keyof WorkbookPermissionService;
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
                const worksheetPermissionCheckFnName = `get${type}Permission` as keyof WorksheetPermissionService;
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


    private _initRangePermissionFromSnapshot() {
        this.disposeWithMe(
            this._selectionProtectionRuleModel.rangeRuleInitStateChange$.subscribe((state) => {
                if (state) {
                    const allAllowedParams: {
                        objectID: string;
                        unitID: string;
                        objectType: UnitObject;
                        actions: UnitAction[];
                    }[] = [];
                    const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverType.UNIVER_SHEET)!;
                    const unitId = workbook.getUnitId();
                    const allSheets = workbook.getSheets();
                    const permissionIdWithRuleInstanceMap = new Map();
                    allSheets.forEach((sheet) => {
                        const subunitId = sheet.getSheetId();
                        this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subunitId).forEach((rule) => {
                            permissionIdWithRuleInstanceMap.set(rule.permissionId, rule);
                            allAllowedParams.push({
                                objectID: rule.permissionId,
                                unitID: unitId,
                                objectType: UnitObject.SelectRange,
                                actions: [UnitAction.View, UnitAction.Edit],
                            });
                        });
                    });
                    this.authzIoService.batchAllowed(allAllowedParams).then((permissionMap) => {
                        permissionMap.forEach((item) => {
                            const rule = permissionIdWithRuleInstanceMap.get(item.objectID);
                            if (rule) {
                                getAllRangePermissionPoint().forEach((F) => {
                                    const instance = new F(unitId, rule.subUnitId, item.objectID);
                                    const unitActionName = mapPermissionPointToSubEnum(instance.subType as unknown as SubUnitPermissionType);
                                    const result = item.actions.find((action) => action.action === unitActionName);
                                    if (result?.allowed !== undefined) {
                                        this._permissionService.updatePermissionPoint(instance.id, result.allowed);
                                    }
                                });
                            }
                        });
                    });
                }
            })
        );
    }

    private _initRangePermissionChange() {
        this.disposeWithMe(
            this._selectionProtectionRuleModel.ruleChange$.subscribe((info) => {
                this.authzIoService.allowed({
                    objectID: info.rule.permissionId,
                    unitID: info.unitId,
                    objectType: UnitObject.SelectRange,
                    actions: [UnitAction.Edit, UnitAction.View],
                }).then((permissionMap) => {
                    getAllRangePermissionPoint().forEach((F) => {
                        const rule = info.rule;
                        const instance = new F(rule.unitId, rule.subUnitId, rule.permissionId);
                        const unitActionName = mapPermissionPointToSubEnum(instance.subType as unknown as SubUnitPermissionType);
                        if (permissionMap.hasOwnProperty(unitActionName)) {
                            this._permissionService.updatePermissionPoint(instance.id, permissionMap[unitActionName]);
                        }
                    });
                });
            })
        );
    }

    private _initWorksheetPermissionFromSnapshot() {
        this.disposeWithMe(
            this._worksheetProtectionRuleModel.worksheetRuleInitStateChange$.subscribe((state) => {
                if (state) {
                    const allAllowedParams: {
                        objectID: string;
                        unitID: string;
                        objectType: UnitObject;
                        actions: UnitAction[];
                    }[] = [];
                    const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverType.UNIVER_SHEET)!;
                    const unitId = workbook.getUnitId();
                    const allSheets = workbook.getSheets();
                    const permissionIdWithRuleInstanceMap = new Map();
                    allSheets.forEach((sheet) => {
                        const subunitId = sheet.getSheetId();
                        const rule = this._worksheetProtectionRuleModel.getRule(unitId, subunitId);
                        if (rule) {
                            permissionIdWithRuleInstanceMap.set(rule.permissionId, rule);
                            allAllowedParams.push({
                                objectID: rule.permissionId,
                                unitID: unitId,
                                objectType: UnitObject.Worksheet,
                                actions: defaultWorksheetPermissionPoint,
                            });
                        }
                    });

                    this.authzIoService.batchAllowed(allAllowedParams).then((permissionMap) => {
                        permissionMap.forEach((item) => {
                            const rule = permissionIdWithRuleInstanceMap.get(item.objectID);
                            if (rule) {
                                getAllWorksheetPermissionPoint().forEach((F) => {
                                    const instance = new F(unitId, rule.subUnitId);
                                    const unitActionName = mapPermissionPointToSubEnum(instance.subType);
                                    const result = item.actions.find((action) => action.action === unitActionName);
                                    if (result?.allowed !== undefined) {
                                        this._permissionService.updatePermissionPoint(instance.id, result.allowed);
                                    }
                                });
                            }
                        });
                    });
                }
            })
        );
    }

    private _initWorksheetPermissionChange() {
        this.disposeWithMe(
            this._worksheetProtectionRuleModel.ruleChange$.subscribe((info) => {
                if (info.type !== 'delete') {
                    this.authzIoService.allowed({
                        objectID: info.rule.permissionId,
                        unitID: info.unitId,
                        objectType: UnitObject.Worksheet,
                        actions: defaultWorksheetPermissionPoint,
                    }).then((permissionMap) => {
                        getAllWorksheetPermissionPoint().forEach((F) => {
                            const instance = new F(info.unitId, info.subUnitId);
                            const unitActionName = mapPermissionPointToSubEnum(instance.subType);
                            if (permissionMap.hasOwnProperty(unitActionName)) {
                                this._permissionService.updatePermissionPoint(instance.id, permissionMap[unitActionName]);
                            }
                        });
                    });
                }
            })
        );
    }
}

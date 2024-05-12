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
import { Disposable, DisposableCollection, IAuthzIoService, ICommandService, IPermissionService, IUniverInstanceService, LifecycleStages, mapPermissionPointToSubEnum, OnLifecycle, RangeUnitPermissionType, Rectangle, SubUnitPermissionType, Tools, UniverInstanceType } from '@univerjs/core';
import { InsertCommand } from '@univerjs/docs';
import type { EffectRefRangeParams, GetWorkbookPermissionFunc, GetWorksheetPermission, IInsertColCommandParams, IInsertColMutationParams, IInsertRowCommandParams, IMoveColsCommandParams, IMoveRangeCommandParams, IMoveRowsCommandParams, IMoveRowsMutationParams, IRemoveRowColCommandParams, ISetWorksheetActivateCommandParams } from '@univerjs/sheets';
import { defaultWorksheetPermissionPoint, DeltaColumnWidthCommand, DeltaRowHeightCommand, getAllWorksheetPermissionPoint, InsertColCommand, InsertColMutation, InsertRowCommand, InsertRowMutation, MoveColsMutation, MoveRangeCommand, MoveRowsMutation, RefRangeService, RemoveColCommand, RemoveColMutation, RemoveRowCommand, RemoveRowMutation, SelectionManagerService, SetBackgroundColorCommand, SetColWidthCommand, SetRowHeightCommand, SetWorksheetActivateCommand, SetWorksheetRowIsAutoHeightCommand, SheetInterceptorService, WorkbookPermissionService, WorksheetPermissionService, WorksheetProtectionRuleModel } from '@univerjs/sheets';
import { Inject } from '@wendellhu/redi';
import { IDialogService } from '@univerjs/ui';
import { UNIVER_SHEET_PERMISSION_ALERT_DIALOG, UNIVER_SHEET_PERMISSION_ALERT_DIALOG_ID } from '@univerjs/sheets-permission-ui';

import { AddRangeProtectionCommand, getAllRangePermissionPoint, SelectionProtectionRuleModel, SetRangeProtectionCommand, SetSelectionProtection } from '@univerjs/sheets-selection-protection';
import { UnitAction, UnitObject, UniverType } from '@univerjs/protocol';
import { MoveColsCommand, MoveRowsCommand } from '@univerjs/sheets/commands/commands/move-rows-cols.command.js';
import type { IAddRangeProtectionParams } from '@univerjs/sheets-permission-ui/command/type.js';
import type { ISetSelectionProtectionParams } from '@univerjs/sheets-selection-protection/commands/mutation/set-selection-protection.js';
import { SetCellEditVisibleOperation } from '../commands/operations/cell-edit.operation';
import { SetRangeBoldCommand, SetRangeItalicCommand, SetRangeStrickThroughCommand, SetRangeUnderlineCommand } from '../commands/commands/inline-format.command';
import { SheetCopyCommand } from '../commands/commands/clipboard.command';
import { ApplyFormatPainterCommand } from '../commands/commands/set-format-painter.command';

type ICellPermission = Record<RangeUnitPermissionType, boolean> & { ruleId?: string; ranges?: IRange[] };
type ICheckPermissionCommandParams = IMoveRowsCommandParams | IMoveColsCommandParams | IMoveRangeCommandParams;
type IMoveRowsOrColsMutationParams = IMoveRowsMutationParams;

const mutationIdByRowCol = [InsertColMutation.id, InsertRowMutation.id, RemoveColMutation.id, RemoveRowMutation.id];
const mutationIdArrByMove = [MoveRowsMutation.id, MoveColsMutation.id];

@OnLifecycle(LifecycleStages.Rendered, SheetPermissionController)
export class SheetPermissionController extends Disposable {
    disposableCollection = new DisposableCollection();

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
        @Inject(WorksheetProtectionRuleModel) private _worksheetProtectionRuleModel: WorksheetProtectionRuleModel,
        @Inject(RefRangeService) private readonly _refRangeService: RefRangeService,
        @Inject(SheetInterceptorService) private _sheetInterceptorService: SheetInterceptorService
    ) {
        super();
        this._initialize();
        this._initRangePermissionFromSnapshot();
        this._initRangePermissionChange();
        this._initWorksheetPermissionFromSnapshot();
        this._initWorksheetPermissionChange();
        this._onRefRangeChange();
        this._correctPermissionRange();
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


    private _getPermissionCheck(id: string, params: ICheckPermissionCommandParams) {
        let permission = true;
        switch (id) {
            case InsertCommand.id:
            case SetCellEditVisibleOperation.id:
                permission = this._permissionCheckWithoutRange({
                    rangeType: RangeUnitPermissionType.Edit,
                    worksheetType: [SubUnitPermissionType.SetCellValue],
                });
                break;
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
            case SetColWidthCommand.id:
            case SetRowHeightCommand.id:
            case SetWorksheetRowIsAutoHeightCommand.id:
                permission = this._permissionCheckWithoutRange({
                    worksheetType: [SubUnitPermissionType.RowHeightColWidth],
                });
                break;
            case MoveColsCommand.id:
            case MoveRowsCommand.id:
                // 这里有两部分拦截 要是起点包含权限位置且没有权限，这里要手势拦截；
                // 要是重点包含权限位置且没有权限，则是command拦截
                permission = this._permissionCheckByMoveCommand(params);
                break;

            case MoveRangeCommand.id:
                // 这里有两部分拦截 要是起点包含权限位置且没有权限，这里要手势拦截；
                // 要是重点包含权限位置且没有权限，则是command拦截
                permission = this._permissionCheckByMoveRangeCommand(params);
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
                this._getPermissionCheck(command.id, command?.params as ICheckPermissionCommandParams);
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

    private _permissionCheckByMoveCommand(params: IMoveRowsCommandParams | IMoveColsCommandParams) {
        const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
        const worksheet = workbook?.getActiveSheet();
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();
        const fromRange = params.fromRange;
        if (fromRange.endRow === worksheet.getRowCount() - 1) {
            fromRange.endColumn = fromRange.startColumn;
        } else {
            fromRange.endRow = fromRange.startRow;
        }
        const permissionLapRanges = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).reduce((p, c) => {
            return [...p, ...c.ranges];
        }, [] as IRange[]).filter((range) => {
            return Rectangle.intersects(range, fromRange);
        });

        if (permissionLapRanges.length > 0) {
            return false;
        }
        // 这里需不需要校验有编辑权限呢 还是说有重叠就全部不允许移动
        // permissionLapRanges.forEach((range) => {
        //     for (let row = range.startRow; row <= range.endRow; row++) {
        //         for (let col = range.startColumn; col <= range.endColumn; col++) {
        //             const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
        //             if (permission?.Edit === false) {
        //                 return false;
        //             }
        //         }
        //     }
        // });
        return true;
    }

    private _permissionCheckByMoveRangeCommand(params: IMoveRangeCommandParams) {
        const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
        const worksheet = workbook?.getActiveSheet();
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();
        const fromRange = params.fromRange;
        const permissionLapRanges = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).reduce((p, c) => {
            return [...p, ...c.ranges];
        }, [] as IRange[]).filter((range) => {
            return Rectangle.intersects(range, fromRange);
        });

        if (permissionLapRanges.length > 0) {
            return false;
        }
        // 这里需不需要校验有编辑权限呢 还是说有重叠就全部不允许移动
        // permissionLapRanges.forEach((range) => {
        //     for (let row = range.startRow; row <= range.endRow; row++) {
        //         for (let col = range.startColumn; col <= range.endColumn; col++) {
        //             const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
        //             if (permission?.Edit === false) {
        //                 return false;
        //             }
        //         }
        //     }
        // });
        return true;
    }

    refRangeHandle(config: EffectRefRangeParams, unitId: string, subUnitId: string) {
        switch (config.id) {
            case MoveRowsCommand.id:
                return this._getRefRangeMutationsByMoveRows(config.params as IMoveRowsCommandParams, unitId, subUnitId);
            case MoveColsCommand.id:
                return this._getRefRangeMutationsByMoveCols(config.params as IMoveColsCommandParams, unitId, subUnitId);
            case InsertRowCommand.id:
                return this._getRefRangeMutationsByInsertRows(config.params as IInsertRowCommandParams, unitId, subUnitId);
            case InsertColCommand.id:
                return this._getRefRangeMutationsByInsertCols(config.params as IInsertColCommandParams, unitId, subUnitId);
            case RemoveColCommand.id:
                return this._getRefRangeMutationsByDeleteCols(config.params as IRemoveRowColCommandParams, unitId, subUnitId);
            case RemoveRowCommand.id:
                return this._getRefRangeMutationsByDeleteRows(config.params as IRemoveRowColCommandParams, unitId, subUnitId);
            default:
                break;
        }
        return { redos: [], undos: [] };
    }

    private _getRefRangeMutationsByDeleteCols(params: IRemoveRowColCommandParams, unitId: string, subUnitId: string) {
        const permissionRangeLapRules = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).filter((rule) => {
            return rule.ranges.some((range) => {
                return Rectangle.intersects(range, params.range);
            });
        });

        const removeRange = params.range;
        if (permissionRangeLapRules.length) {
            const redoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            const undoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            permissionRangeLapRules.forEach((rule) => {
                const cloneRule = Tools.deepClone(rule);
                const rangesByRemove = cloneRule.ranges.reduce((p, c) => {
                    if (Rectangle.intersects(c, removeRange)) {
                        const cloneRange = Tools.deepClone(c);
                        const { startColumn, endColumn } = removeRange;
                        if (startColumn <= cloneRange.startColumn && endColumn >= cloneRange.endColumn) {
                            return p;
                        } else if (startColumn >= cloneRange.startColumn && endColumn <= cloneRange.endColumn) {
                            cloneRange.endColumn -= endColumn - startColumn + 1;
                        } else if (startColumn < cloneRange.startColumn) {
                            cloneRange.startColumn = startColumn;
                            cloneRange.endColumn -= endColumn - startColumn + 1;
                        } else if (endColumn > cloneRange.endColumn) {
                            cloneRange.endColumn = startColumn - 1;
                        }
                        if (this._checkIsRightRange(cloneRange)) {
                            p.push(cloneRange);
                        }
                    }
                    return p;
                }, [] as IRange[]);
                cloneRule.ranges = rangesByRemove;
                redoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule: cloneRule, ruleId: rule.id } });
                undoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule, ruleId: rule.id } });
            });

            return { redos: redoMutations, undos: undoMutations };
        }
        return { undos: [], redos: [] };
    }

    private _getRefRangeMutationsByDeleteRows(params: IRemoveRowColCommandParams, unitId: string, subUnitId: string) {
        const permissionRangeLapRules = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).filter((rule) => {
            return rule.ranges.some((range) => {
                return Rectangle.intersects(range, params.range);
            });
        });

        const removeRange = params.range;
        if (permissionRangeLapRules.length) {
            const redoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            const undoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            permissionRangeLapRules.forEach((rule) => {
                const cloneRule = Tools.deepClone(rule);
                const rangesByRemove = cloneRule.ranges.reduce((p, c) => {
                    if (Rectangle.intersects(c, removeRange)) {
                        const cloneRange = Tools.deepClone(c);
                        const { startRow, endRow } = removeRange;
                        if (startRow <= cloneRange.startRow && endRow >= cloneRange.endRow) {
                            return p;
                        } else if (startRow >= cloneRange.startRow && endRow <= cloneRange.endRow) {
                            cloneRange.endRow -= endRow - startRow + 1;
                        } else if (startRow < cloneRange.startRow) {
                            cloneRange.startRow = startRow;
                            cloneRange.endRow -= endRow - startRow + 1;
                        } else if (endRow > cloneRange.endRow) {
                            cloneRange.endRow = startRow - 1;
                        }
                        if (this._checkIsRightRange(cloneRange)) {
                            p.push(cloneRange);
                        }
                    }
                    return p;
                }, [] as IRange[]);
                cloneRule.ranges = rangesByRemove;
                redoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule: cloneRule, ruleId: rule.id } });
                undoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule, ruleId: rule.id } });
            });

            return { redos: redoMutations, undos: undoMutations };
        }
        return { undos: [], redos: [] };
    }

    private _getRefRangeMutationsByInsertCols(params: IInsertColCommandParams, unitId: string, subUnitId: string) {
        const insertStart = params.range.startColumn;
        const insertLength = params.range.endColumn - params.range.startColumn + 1;

        const permissionRangeLapRules = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).filter((rule) => {
            return rule.ranges.some((range) => {
                return insertStart > range.startColumn && insertStart <= range.endColumn;
            });
        });

        if (permissionRangeLapRules.length) {
            const redoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            const undoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            permissionRangeLapRules.forEach((rule) => {
                const cloneRule = Tools.deepClone(rule);
                let hasLap = false;
                cloneRule.ranges.forEach((range) => {
                    if (insertStart > range.startColumn && insertStart <= range.endColumn) {
                        range.endColumn += insertLength;
                        hasLap = true;
                    }
                });
                if (hasLap) {
                    redoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule: cloneRule, ruleId: rule.id } });
                    undoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule, ruleId: rule.id } });
                }
            });

            return { redos: redoMutations, undos: undoMutations };
        }
        return { undos: [], redos: [] };
    }

    private _getRefRangeMutationsByInsertRows(params: IInsertRowCommandParams, unitId: string, subUnitId: string) {
        const insertStart = params.range.startRow;
        const insertLength = params.range.endRow - params.range.startRow + 1;

        const permissionRangeLapRules = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).filter((rule) => {
            return rule.ranges.some((range) => {
                return insertStart > range.startRow && insertStart <= range.endRow;
            });
        });

        if (permissionRangeLapRules.length) {
            const redoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            const undoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            permissionRangeLapRules.forEach((rule) => {
                const cloneRule = Tools.deepClone(rule);
                let hasLap = false;
                cloneRule.ranges.forEach((range) => {
                    if (insertStart > range.startRow && insertStart <= range.endRow) {
                        range.endRow += insertLength;
                        hasLap = true;
                    }
                });
                if (hasLap) {
                    redoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule: cloneRule, ruleId: rule.id } });
                    undoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule, ruleId: rule.id } });
                }
            });

            return { redos: redoMutations, undos: undoMutations };
        }
        return { undos: [], redos: [] };
    }

    private _getRefRangeMutationsByMoveRows(params: IMoveRowsCommandParams, unitId: string, subUnitId: string) {
        const toRange = params.toRange;
        const moveToStartRow = toRange.startRow;
        const moveLength = toRange.endRow - toRange.startRow + 1;

        const permissionRangeLapRules = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).filter((rule) => {
            return rule.ranges.some((range) => {
                return moveToStartRow > range.startRow && moveToStartRow <= range.endRow;
            });
        });

        if (permissionRangeLapRules.length) {
            const redoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            const undoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            permissionRangeLapRules.forEach((rule) => {
                const cloneRule = Tools.deepClone(rule);
                const fromRange = params.fromRange;
                const moveFromStartRow = fromRange.startRow;
                let hasLap = false;
                cloneRule.ranges.forEach((range) => {
                    if (moveToStartRow > range.startRow && moveToStartRow <= range.endRow) {
                        if (moveFromStartRow < range.startRow) {
                            range.startRow = range.startRow - moveLength;
                            range.endRow = range.endRow - moveLength;
                        }
                        range.endRow += moveLength;
                        hasLap = true;
                    }
                });
                if (hasLap) {
                    redoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule: cloneRule, ruleId: rule.id } });
                    undoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule, ruleId: rule.id } });
                }
            });

            return { redos: redoMutations, undos: undoMutations };
        }

        return { undos: [], redos: [] };
    }

    private _getRefRangeMutationsByMoveCols(params: IMoveColsCommandParams, unitId: string, subUnitId: string) {
        const toRange = params.toRange;
        const moveToStartCol = toRange.startColumn;
        const moveLength = toRange.endColumn - toRange.startColumn + 1;

        const permissionRangeLapRules = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).filter((rule) => {
            return rule.ranges.some((range) => {
                return moveToStartCol > range.startColumn && moveToStartCol <= range.endColumn;
            });
        });

        if (permissionRangeLapRules.length) {
            const redoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            const undoMutations: { id: string; params: ISetSelectionProtectionParams }[] = [];
            permissionRangeLapRules.forEach((rule) => {
                const cloneRule = Tools.deepClone(rule);
                const fromRange = params.fromRange;
                const moveFromStartCol = fromRange.startColumn;
                let hasLap = false;
                cloneRule.ranges.forEach((range) => {
                    if (moveToStartCol > range.startColumn && moveToStartCol <= range.endColumn) {
                        if (moveFromStartCol < range.startColumn) {
                            range.startColumn = range.startColumn - moveLength;
                            range.endColumn = range.endColumn - moveLength;
                        }
                        range.endColumn += moveLength;
                        hasLap = true;
                    }
                });
                if (hasLap) {
                    redoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule: cloneRule, ruleId: rule.id } });
                    undoMutations.push({ id: SetSelectionProtection.id, params: { unitId, subUnitId, rule, ruleId: rule.id } });
                }
            });

            return { redos: redoMutations, undos: undoMutations };
        }

        return { undos: [], redos: [] };
    }

    private _onRefRangeChange() {
        const registerRefRange = (unitId: string, subUnitId: string) => {
            const workbook = this._univerInstanceService.getUniverSheetInstance(unitId);
            if (!workbook) {
                return;
            }
            const workSheet = workbook?.getSheetBySheetId(subUnitId);
            if (!workSheet) {
                return;
            }

            this.disposableCollection.dispose();

            const handler = (config: EffectRefRangeParams) => {
                return this.refRangeHandle(config, unitId, subUnitId);
            };

            const permissionRanges = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).reduce((p, c) => {
                return [...p, ...c.ranges];
            }, [] as IRange[]);

            permissionRanges.forEach((range) => {
                this.disposableCollection.add(this._refRangeService.registerRefRange(range, handler, unitId, subUnitId));
            });
        };
        this.disposeWithMe(
            this._commandService.onCommandExecuted((commandInfo) => {
                if (commandInfo.id === SetWorksheetActivateCommand.id) {
                    const params = commandInfo.params as ISetWorksheetActivateCommandParams;
                    const sheetId = params.subUnitId;
                    const unitId = params.unitId;
                    if (!sheetId || !unitId) {
                        return;
                    }
                    registerRefRange(unitId, sheetId);
                }
                if (commandInfo.id === AddRangeProtectionCommand.id || commandInfo.id === SetRangeProtectionCommand.id) {
                    const params = commandInfo.params as IAddRangeProtectionParams;
                    const subUnitId = params.rule.subUnitId;
                    const unitId = params.rule.unitId;
                    if (!subUnitId || !unitId) {
                        return;
                    }
                    registerRefRange(unitId, subUnitId);
                }
            })
        );

        const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
        if (workbook) {
            const sheet = workbook.getActiveSheet();
            registerRefRange(workbook.getUnitId(), sheet.getSheetId());
        }
    }

    // eslint-disable-next-line max-lines-per-function
    private _correctPermissionRange() {
        // eslint-disable-next-line max-lines-per-function
        this.disposeWithMe(this._commandService.onCommandExecuted((command: ICommandInfo) => {
            if (mutationIdArrByMove.includes(command.id)) {
                if (!command.params) return;
                const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
                if (!workbook) return;
                const worksheet = workbook.getSheetBySheetId((command.params as IMoveRowsMutationParams).subUnitId);
                if (!worksheet) return;
                const { sourceRange, targetRange } = command.params as IMoveRowsOrColsMutationParams;
                const isRowMove = sourceRange.startColumn === targetRange.startColumn && sourceRange.endColumn === targetRange.endColumn;
                const moveLength = isRowMove
                    ? sourceRange.endRow - sourceRange.startRow + 1
                    : sourceRange.endColumn - sourceRange.startColumn + 1;
                const sourceStart = isRowMove ? sourceRange.startRow : sourceRange.startColumn;
                const targetStart = isRowMove ? targetRange.startRow : targetRange.startColumn;
                // const mergeData = worksheet.getConfig().mergeData;
                const permissionListRule = this._selectionProtectionRuleModel.getSubunitRuleList(workbook.getUnitId(), worksheet.getSheetId());

                permissionListRule.forEach((rule) => {
                    const ranges = rule.ranges;
                    ranges.forEach((range) => {
                        let { startRow, endRow, startColumn, endColumn } = range;

                        if (!Rectangle.intersects(range, sourceRange)) {
                            if (isRowMove) {
                                if (sourceStart < startRow && targetStart > endRow) {
                                    startRow -= moveLength;
                                    endRow -= moveLength;
                                } else if (sourceStart > endRow && targetStart <= startRow) {
                                    startRow += moveLength;
                                    endRow += moveLength;
                                }
                            } else {
                                if (sourceStart < startColumn && targetStart > endColumn) {
                                    startColumn -= moveLength;
                                    endColumn -= moveLength;
                                } else if (sourceStart > endColumn && targetStart <= startColumn) {
                                    startColumn += moveLength;
                                    endColumn += moveLength;
                                }
                            }
                        }

                        if (this._checkIsRightRange({ startRow, endRow, startColumn, endColumn })) {
                            range.startColumn = startColumn;
                            range.endColumn = endColumn;
                            range.startRow = startRow;
                            range.endRow = endRow;
                        }
                    });
                });

                this.disposableCollection.dispose();
                const { unitId, subUnitId } = command.params as IMoveRowsMutationParams;
                const handler = (config: EffectRefRangeParams) => {
                    return this.refRangeHandle(config, unitId, subUnitId);
                };

                const permissionRanges = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).reduce((p, c) => {
                    return [...p, ...c.ranges];
                }, [] as IRange[]);

                permissionRanges.forEach((range) => {
                    this.disposableCollection.add(this._refRangeService.registerRefRange(range, handler, unitId, subUnitId));
                });
            }

            // 2. InsertRowsOrCols / RemoveRowsOrCols Mutations
            if (mutationIdByRowCol.includes(command.id)) {
                const workbook = this._univerInstanceService.getUniverSheetInstance((command.params as IInsertColMutationParams).unitId);
                if (!workbook) return;
                const worksheet = workbook.getSheetBySheetId((command.params as IInsertColMutationParams).subUnitId);
                if (!worksheet) return;

                const params = command.params as IInsertRowCommandParams;
                if (!params) return;
                const { range } = params;

                const isRowOperation = command.id.includes('row');
                const isAddOperation = command.id.includes('insert');

                const operationStart = isRowOperation ? range.startRow : range.startColumn;
                const operationEnd = isRowOperation ? range.endRow : range.endColumn;
                const operationCount = operationEnd - operationStart + 1;

                const permissionListRule = this._selectionProtectionRuleModel.getSubunitRuleList(workbook.getUnitId(), worksheet.getSheetId());

                permissionListRule.forEach((rule) => {
                    const ranges = rule.ranges;
                    ranges.forEach((range) => {
                        let { startRow, endRow, startColumn, endColumn } = range;

                        if (isAddOperation) {
                            if (isRowOperation) {
                                if (operationStart <= startRow) {
                                    startRow += operationCount;
                                    endRow += operationCount;
                                }
                            } else {
                                if (operationStart <= startColumn) {
                                    startColumn += operationCount;
                                    endColumn += operationCount;
                                }
                            }
                        } else {
                            if (isRowOperation) {
                                if (operationEnd < startRow) {
                                    startRow -= operationCount;
                                    endRow -= operationCount;
                                }
                            } else {
                                if (operationEnd < startColumn) {
                                    startColumn -= operationCount;
                                    endColumn -= operationCount;
                                }
                            }
                        }

                        if (this._checkIsRightRange({ startRow, endRow, startColumn, endColumn })) {
                            range.startColumn = startColumn;
                            range.endColumn = endColumn;
                            range.startRow = startRow;
                            range.endRow = endRow;
                        }
                    });
                });


                this.disposableCollection.dispose();
                const { unitId, subUnitId } = command.params as IMoveRowsMutationParams;
                const handler = (config: EffectRefRangeParams) => {
                    return this.refRangeHandle(config, unitId, subUnitId);
                };

                const permissionRanges = this._selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId).reduce((p, c) => {
                    return [...p, ...c.ranges];
                }, [] as IRange[]);

                permissionRanges.forEach((range) => {
                    this.disposableCollection.add(this._refRangeService.registerRefRange(range, handler, unitId, subUnitId));
                });
            }
        }));
    }

    private _checkIsRightRange(range: IRange) {
        return range.startRow <= range.endRow && range.startColumn <= range.endColumn;
    }
}

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


import type { ICellDataForSheetInterceptor, IPermissionTypes, IRange, Nullable, Workbook, Worksheet } from '@univerjs/core';
import { IUniverInstanceService, Rectangle, Tools, UniverInstanceType } from '@univerjs/core';
import type { GetWorkbookPermissionFunc, GetWorksheetPermission } from '@univerjs/sheets';
import { SelectionManagerService, WorkbookPermissionService, WorksheetPermissionService } from '@univerjs/sheets';
import type { ICellPermission } from '@univerjs/sheets-selection-protection';
import { SelectionProtectionRuleModel } from '@univerjs/sheets-selection-protection';
import { WorksheetProtectionRuleModel } from '@univerjs/sheets/services/permission/worksheet-permission/worksheet-permission.model.ts';
import type { IAccessor } from '@wendellhu/redi';
import type { Observable } from 'rxjs';
import { map, merge, of, switchMap } from 'rxjs';

interface IActive {
    workbook: Workbook;
    worksheet: Worksheet;
}

function getActiveSheet$(univerInstanceService: IUniverInstanceService): Observable<Nullable<IActive>> {
    return univerInstanceService.getCurrentTypeOfUnit$<Workbook>(UniverInstanceType.UNIVER_SHEET).pipe(switchMap((workbook) =>
        workbook
            ? workbook.activeSheet$.pipe(map((worksheet) => {
                if (!worksheet) return null;
                return { workbook, worksheet };
            }))
            : of(null)));
}

export function deriveStateFromActiveSheet$<T>(univerInstanceService: IUniverInstanceService, defaultValue: T, callback: (active: IActive) => Observable<T>) {
    return getActiveSheet$(univerInstanceService).pipe(switchMap((active) => {
        if (!active) return of(defaultValue);
        return callback(active);
    }));
}


export function getCurrentRangeDisable$(accessor: IAccessor, permissionTypes: IPermissionTypes = {}) {
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const selectionManagerService = accessor.get(SelectionManagerService);
    const selectionRuleModal = accessor.get(SelectionProtectionRuleModel);
    const workbookPermissionService = accessor.get(WorkbookPermissionService);
    const worksheetRuleModel = accessor.get(WorksheetProtectionRuleModel);
    const worksheetPermissionService = accessor.get(WorksheetPermissionService);

    const rangeDisable$ = merge(
        selectionManagerService.selectionMoveEnd$,
        selectionRuleModal.ruleChange$,
        worksheetRuleModel.ruleChange$
    ).pipe(
        map(() => {
            const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
            const worksheet = workbook.getActiveSheet();
            const selections = selectionManagerService.getSelections();
            const selectionRanges = selections?.map((selection) => selection.range);
            const { workbookType, worksheetType, rangeType } = permissionTypes;
            if (workbookType) {
                const workbookDisable = workbookType.some((type) => {
                    const workbookPermissionCheckFnName = `get${type}Permission` as keyof WorkbookPermissionService;
                    const workbookPermissionCheckFn = workbookPermissionService[workbookPermissionCheckFnName] as GetWorkbookPermissionFunc;
                    const workbookPermission = workbookPermissionCheckFn(workbook.getUnitId());
                    if (workbookPermission === false) {
                        return true;
                    } else {
                        return false;
                    }
                });
                if (workbookDisable === true) {
                    return true;
                }
            }
            if (worksheetType) {
                const worksheetDisable = worksheetType.some((type) => {
                    const worksheetPermissionCheckFnName = `get${type}Permission` as keyof WorksheetPermissionService;
                    const worksheetPermissionCheckFn = worksheetPermissionService[worksheetPermissionCheckFnName] as GetWorksheetPermission;
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
                    return true;
                }
            }
            if (rangeType) {
                const rangeDisable = selectionRanges?.some((range) => {
                    for (let row = range.startRow; row <= range.endRow; row++) {
                        for (let col = range.startColumn; col <= range.endColumn; col++) {
                            const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
                            if (permission?.[rangeType] === false) {
                                return true;
                            }
                        }
                    }
                    return false;
                });
                if (rangeDisable === true) {
                    return true;
                }
            }
            return false;
        })
    );

    return rangeDisable$;
}


export function getBaseRangeMenuHidden$(accessor: IAccessor) {
    const univerInstanceService = accessor.get(IUniverInstanceService);

    const selectionManagerService = accessor.get(SelectionManagerService);
    const selectionRuleModal = accessor.get(SelectionProtectionRuleModel);


    return selectionManagerService.selectionMoveEnd$.pipe(
        map(() => {
            const range = selectionManagerService.getLast()?.range;
            if (!range) return true;

            const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
            const worksheet = workbook.getActiveSheet();
            const unitId = workbook.getUnitId();
            const subUnitId = worksheet.getSheetId();

            const permissionLapRanges = selectionRuleModal.getSubunitRuleList(unitId, subUnitId).reduce((acc, rule) => {
                return [...acc, ...rule.ranges];
            }, [] as IRange[]).filter((ruleRange) => Rectangle.intersects(range, ruleRange));

            return permissionLapRanges.some((ruleRange) => {
                const { startRow, startColumn, endRow, endColumn } = ruleRange;
                for (let row = startRow; row <= endRow; row++) {
                    for (let col = startColumn; col <= endColumn; col++) {
                        const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
                        if (permission?.Edit === false) {
                            return true;
                        }
                    }
                }
                return false;
            });
        })
    );
}

export function getInsertAfterMenuHidden$(accessor: IAccessor, type: 'row' | 'col') {
    const univerInstanceService = accessor.get(IUniverInstanceService);

    const selectionManagerService = accessor.get(SelectionManagerService);
    const selectionRuleModal = accessor.get(SelectionProtectionRuleModel);


    return selectionManagerService.selectionMoveEnd$.pipe(
        map(() => {
            const range = selectionManagerService.getLast()?.range;
            if (!range) return true;

            const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
            const worksheet = workbook.getActiveSheet();
            const unitId = workbook.getUnitId();
            const subUnitId = worksheet.getSheetId();

            const permissionLapRanges = selectionRuleModal.getSubunitRuleList(unitId, subUnitId).reduce((acc, rule) => {
                return [...acc, ...rule.ranges];
            }, [] as IRange[]).filter((ruleRange) => {
                if (type === 'row') {
                    return range.endRow > ruleRange.startRow && range.endRow <= ruleRange.endRow;
                } else {
                    return range.endColumn > ruleRange.startColumn && range.endColumn <= ruleRange.endColumn;
                }
            });

            return permissionLapRanges.some((ruleRange) => {
                const { startRow, startColumn, endRow, endColumn } = ruleRange;
                for (let row = startRow; row <= endRow; row++) {
                    for (let col = startColumn; col <= endColumn; col++) {
                        const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
                        if (permission?.Edit === false) {
                            return true;
                        }
                    }
                }
                return false;
            });
        })
    );
}

export function getInsertBeforeMenuHidden$(accessor: IAccessor, type: 'row' | 'col') {
    const univerInstanceService = accessor.get(IUniverInstanceService);

    const selectionManagerService = accessor.get(SelectionManagerService);
    const selectionRuleModal = accessor.get(SelectionProtectionRuleModel);


    return selectionManagerService.selectionMoveEnd$.pipe(
        map(() => {
            const range = selectionManagerService.getLast()?.range;
            if (!range) return true;

            const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
            const worksheet = workbook.getActiveSheet();
            const unitId = workbook.getUnitId();
            const subUnitId = worksheet.getSheetId();


            const permissionLapRanges = selectionRuleModal.getSubunitRuleList(unitId, subUnitId).reduce((acc, rule) => {
                return [...acc, ...rule.ranges];
            }, [] as IRange[]).filter((ruleRange) => {
                if (type === 'row') {
                    return range.startRow > ruleRange.startRow && range.startRow <= ruleRange.endRow;
                } else {
                    return range.startColumn > ruleRange.startColumn && range.startColumn <= ruleRange.endColumn;
                }
            });

            return permissionLapRanges.some((ruleRange) => {
                const { startRow, startColumn, endRow, endColumn } = ruleRange;
                for (let row = startRow; row <= endRow; row++) {
                    for (let col = startColumn; col <= endColumn; col++) {
                        const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
                        if (permission?.Edit === false) {
                            return true;
                        }
                    }
                }
                return false;
            });
        })
    );
}

export function getDeleteMenuHidden$(accessor: IAccessor, type: 'row' | 'col') {
    const univerInstanceService = accessor.get(IUniverInstanceService);

    const selectionManagerService = accessor.get(SelectionManagerService);
    const selectionRuleModal = accessor.get(SelectionProtectionRuleModel);

    return selectionManagerService.selectionMoveEnd$.pipe(
        map(() => {
            const range = selectionManagerService.getLast()?.range;
            if (!range) return true;

            const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
            const worksheet = workbook.getActiveSheet();
            const unitId = workbook.getUnitId();
            const subUnitId = worksheet.getSheetId();

            const rowColRangeExpand = Tools.deepClone(range);

            if (type === 'row') {
                rowColRangeExpand.startColumn = 0;
                rowColRangeExpand.endColumn = worksheet.getColumnCount() - 1;
            } else {
                rowColRangeExpand.startRow = 0;
                rowColRangeExpand.endRow = worksheet.getRowCount() - 1;
            }
            const permissionLapRanges = selectionRuleModal.getSubunitRuleList(unitId, subUnitId).reduce((acc, rule) => {
                return [...acc, ...rule.ranges];
            }, [] as IRange[]).filter((ruleRange) => Rectangle.intersects(rowColRangeExpand, ruleRange));

            return permissionLapRanges.some((ruleRange) => {
                const { startRow, startColumn, endRow, endColumn } = ruleRange;
                for (let row = startRow; row <= endRow; row++) {
                    for (let col = startColumn; col <= endColumn; col++) {
                        const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
                        if (permission?.Edit === false) {
                            return true;
                        }
                    }
                }
                return false;
            });
        })
    );
}

export function getCellMenuHidden$(accessor: IAccessor, type: 'row' | 'col') {
    const univerInstanceService = accessor.get(IUniverInstanceService);

    const selectionManagerService = accessor.get(SelectionManagerService);
    const selectionRuleModal = accessor.get(SelectionProtectionRuleModel);


    return selectionManagerService.selectionMoveEnd$.pipe(
        map(() => {
            const range = selectionManagerService.getLast()?.range;
            if (!range) return true;

            const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
            const worksheet = workbook.getActiveSheet();
            const unitId = workbook.getUnitId();
            const subUnitId = worksheet.getSheetId();


            const rowColRangeExpand = Tools.deepClone(range);
            if (type === 'row') {
                rowColRangeExpand.endRow = worksheet.getRowCount() - 1;
            } else {
                rowColRangeExpand.endColumn = worksheet.getColumnCount() - 1;
            }

            const permissionLapRanges = selectionRuleModal.getSubunitRuleList(unitId, subUnitId).reduce((acc, rule) => {
                return [...acc, ...rule.ranges];
            }, [] as IRange[]).filter((ruleRange) => Rectangle.intersects(ruleRange, rowColRangeExpand));

            return permissionLapRanges.some((ruleRange) => {
                const { startRow, startColumn, endRow, endColumn } = ruleRange;
                for (let row = startRow; row <= endRow; row++) {
                    for (let col = startColumn; col <= endColumn; col++) {
                        const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
                        if (permission?.Edit === false) {
                            return true;
                        }
                    }
                }
                return false;
            });
        })
    );
}

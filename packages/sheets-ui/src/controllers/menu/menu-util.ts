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


import type { ICellDataForSheetInterceptor, IPermissionTypes, Nullable, Workbook, Worksheet } from '@univerjs/core';
import { IUniverInstanceService, UniverInstanceType } from '@univerjs/core';
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
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheet = workbook.getActiveSheet();
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

export function getCurrentRangeDisable2$(accessor: IAccessor, permissionTypes: IPermissionTypes = {}) {
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const selectionManagerService = accessor.get(SelectionManagerService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheet = workbook.getActiveSheet();
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

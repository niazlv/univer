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

import type { Workbook } from '@univerjs/core';
import { IUniverInstanceService, Rectangle, UniverInstanceType } from '@univerjs/core';
import { SelectionManagerService, WorkbookPermissionService, WorksheetProtectionRuleModel } from '@univerjs/sheets';
import { SelectionProtectionRuleModel } from '@univerjs/sheets-selection-protection';
import type { IAccessor } from '@wendellhu/redi';
import { combineLatestWith, map, merge } from 'rxjs';

export function getAddPermissionHidden$(accessor: IAccessor) {
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const selectionManagerService = accessor.get(SelectionManagerService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheet = workbook.getActiveSheet();
    const unitId = workbook.getUnitId();
    const subUnitId = worksheet.getSheetId();
    const selectionRuleModel = accessor.get(SelectionProtectionRuleModel);
    const worksheetRuleModel = accessor.get(WorksheetProtectionRuleModel);
    const subUnitRuleList = selectionRuleModel.getSubunitRuleList(unitId, subUnitId);

    return merge(
        selectionManagerService.selectionMoveEnd$,
        selectionRuleModel.ruleChange$,
        worksheetRuleModel.ruleChange$
    ).pipe(
        map(() => {
            const selections = selectionManagerService.getSelections();
            const selectionsRanges = selections?.map((selection) => selection.range);
            const ruleRanges = subUnitRuleList.map((rule) => rule.ranges).flat();
            if (!selectionsRanges) {
                return false;
            }
            return selectionsRanges?.some((selectionRange) => {
                return ruleRanges.some((ruleRange) => {
                    return Rectangle.intersects(selectionRange, ruleRange);
                });
            });
        })
    );
}

export function getEditPermissionHiddenOrDelete$(accessor: IAccessor) {
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const selectionManagerService = accessor.get(SelectionManagerService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheet = workbook.getActiveSheet();
    const unitId = workbook.getUnitId();
    const subUnitId = worksheet.getSheetId();
    const selectionRuleModel = accessor.get(SelectionProtectionRuleModel);
    const subUnitRuleList = selectionRuleModel.getSubunitRuleList(unitId, subUnitId);
    const worksheetRuleModel = accessor.get(WorksheetProtectionRuleModel);

    return merge(
        selectionManagerService.selectionMoveEnd$,
        selectionRuleModel.ruleChange$,
        worksheetRuleModel.ruleChange$
    ).pipe(
        map(() => {
            const selection = selectionManagerService.getLast();
            const selectedRange = selection?.range;
            const ruleRanges = subUnitRuleList.map((rule) => rule.ranges).flat();
            if (!selectedRange) {
                return true;
            }
            return ruleRanges.every((ruleRange) => {
                return !Rectangle.intersects(ruleRange, selectedRange);
            });
        })
    );
}

export function getPermissionDisableBase$(accessor: IAccessor) {
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const selectionProtectionRuleModel = accessor.get(SelectionProtectionRuleModel);
    const worksheetProtectionRuleModel = accessor.get(WorksheetProtectionRuleModel);
    const workbookPermissionService = accessor.get(WorkbookPermissionService);
    const unitId = workbook.getUnitId();
    const selectionRuleModel = accessor.get(SelectionProtectionRuleModel);
    const worksheetRuleModel = accessor.get(WorksheetProtectionRuleModel);


    const selectionManagerService = accessor.get(SelectionManagerService);
    return merge(
        selectionManagerService.selectionMoveEnd$,
        selectionRuleModel.ruleChange$,
        worksheetRuleModel.ruleChange$
    ).pipe(
        map(() => {
            const selections = selectionManagerService.getSelections();
            const selectionRanges = selections?.map((selection) => selection.range);
            if (!selectionRanges?.length) {
                return false;
            }
            const worksheet = workbook.getActiveSheet();
            const subUnitId = worksheet.getSheetId();
            const univerManageCollaboratorPermission = workbookPermissionService.getManageCollaboratorPermission(unitId);
            if (!univerManageCollaboratorPermission) {
                return true;
            }
            const worksheetRule = worksheetProtectionRuleModel.getRule(unitId, subUnitId);
            if (worksheetRule) {
                return true;
            }

            const subunitRuleList = selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId);
            return selectionRanges?.some((selectionRange) => {
                return subunitRuleList.some((rule) => {
                    return rule.ranges.some((ruleRange) => {
                        return Rectangle.intersects(selectionRange, ruleRange);
                    });
                });
            });
        })
    );
}

export function getAddPermissionDisable$(accessor: IAccessor) {
    const selectionManagerService = accessor.get(SelectionManagerService);
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheet = workbook.getActiveSheet();
    const unitId = workbook.getUnitId();
    const subUnitId = worksheet.getSheetId();

    const selectionRuleModel = accessor.get(SelectionProtectionRuleModel);
    const worksheetRuleModel = accessor.get(WorksheetProtectionRuleModel);

    const areaHasProtect$ = merge(
        selectionManagerService.selectionMoveEnd$,
        selectionRuleModel.ruleChange$,
        worksheetRuleModel.ruleChange$
    ).pipe(
        map(() => {
            const selections = selectionManagerService.getSelections();
            const selectionsRanges = selections?.map((selection) => selection.range);
            const selectionRuleModel = accessor.get(SelectionProtectionRuleModel);
            const subUnitRuleList = selectionRuleModel.getSubunitRuleList(unitId, subUnitId);
            if (!selectionsRanges?.length || !subUnitRuleList.length) {
                return false;
            }
            return selectionsRanges?.some((selectionRange) => {
                return subUnitRuleList.some((rule) => {
                    return rule.ranges.some((ruleRange) => {
                        return Rectangle.intersects(selectionRange, ruleRange);
                    });
                });
            });
        })
    );
    return getPermissionDisableBase$(accessor).pipe(
        combineLatestWith(areaHasProtect$),
        map(([permissionDisable, areaHasProtect]) => permissionDisable || areaHasProtect)
    );
}

export function getRemovePermissionDisable$(accessor: IAccessor) {
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const selectionProtectionRuleModel = accessor.get(SelectionProtectionRuleModel);
    const worksheetProtectionRuleModel = accessor.get(WorksheetProtectionRuleModel);
    const workbookPermissionService = accessor.get(WorkbookPermissionService);
    const unitId = workbook.getUnitId();


    const worksheetRuleModel = accessor.get(WorksheetProtectionRuleModel);
    const selectionRuleModel = accessor.get(SelectionProtectionRuleModel);
    const selectionManagerService = accessor.get(SelectionManagerService);
    return merge(
        selectionManagerService.selectionMoveEnd$,
        selectionRuleModel.ruleChange$,
        worksheetRuleModel.ruleChange$
    ).pipe(
        map(() => {
            const selections = selectionManagerService.getSelections();
            const selectionRanges = selections?.map((selection) => selection.range);
            if (!selectionRanges?.length) {
                return true;
            }
            const worksheet = workbook.getActiveSheet();
            const subUnitId = worksheet.getSheetId();
            const univerManageCollaboratorPermission = workbookPermissionService.getManageCollaboratorPermission(unitId);
            if (!univerManageCollaboratorPermission) {
                return true;
            }
            const worksheetRule = worksheetProtectionRuleModel.getRule(unitId, subUnitId);
            if (worksheetRule) {
                return false;
            }

            const subunitRuleList = selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId);
            const hasIntersect = selectionRanges?.some((selectionRange) => {
                return subunitRuleList.some((rule) => {
                    return rule.ranges.some((ruleRange) => {
                        return Rectangle.intersects(selectionRange, ruleRange);
                    });
                });
            });

            return !hasIntersect;
        })
    );
}


export function getSetPermissionDisable$(accessor: IAccessor) {
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheetProtectionRuleModel = accessor.get(WorksheetProtectionRuleModel);
    const workbookPermissionService = accessor.get(WorkbookPermissionService);
    const unitId = workbook.getUnitId();


    return worksheetProtectionRuleModel.ruleChange$.pipe(
        map(() => {
            const worksheet = workbook.getActiveSheet();
            const subUnitId = worksheet.getSheetId();
            const univerManageCollaboratorPermission = workbookPermissionService.getManageCollaboratorPermission(unitId);
            if (!univerManageCollaboratorPermission) {
                return true;
            }
            const worksheetRule = worksheetProtectionRuleModel.getRule(unitId, subUnitId);
            if (worksheetRule) {
                return false;
            } else {
                return true;
            }
        })
    );
}

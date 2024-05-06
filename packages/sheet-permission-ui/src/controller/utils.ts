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
import { SelectionManagerService, WorksheetPermissionService } from '@univerjs/sheets';
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
    const selectionRuleModal = accessor.get(SelectionProtectionRuleModel);
    const subUnitRuleList = selectionRuleModal.getSubunitRuleList(unitId, subUnitId);

    return merge(
        selectionManagerService.selectionMoveEnd$,
        selectionRuleModal.ruleChange$
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
    const selectionRuleModal = accessor.get(SelectionProtectionRuleModel);
    const subUnitRuleList = selectionRuleModal.getSubunitRuleList(unitId, subUnitId);

    return merge(
        selectionManagerService.selectionMoveEnd$,
        selectionRuleModal.ruleChange$
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
    const worksheetPermissionService = accessor.get(WorksheetPermissionService);
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheet = workbook.getActiveSheet();
    const unitId = workbook.getUnitId();
    const subUnitId = worksheet.getSheetId();
    return worksheetPermissionService.getManageCollaboratorPermission$({ unitId, subUnitId }).pipe(
        map((permission) => !permission)
    );
}

export function getAddPermissionDisable$(accessor: IAccessor) {
    const selectionManagerService = accessor.get(SelectionManagerService);
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheet = workbook.getActiveSheet();
    const unitId = workbook.getUnitId();
    const subUnitId = worksheet.getSheetId();
    const areaHasProtect$ = selectionManagerService.selectionMoveEnd$.pipe(
        map(() => {
            const selections = selectionManagerService.getSelections();
            const selectionsRanges = selections?.map((selection) => selection.range);
            const selectionRuleModal = accessor.get(SelectionProtectionRuleModel);
            const subUnitRuleList = selectionRuleModal.getSubunitRuleList(unitId, subUnitId);
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

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


import { IUniverInstanceService, UniverInstanceType } from '@univerjs/core';
import type { ICellDataForSheetInterceptor, Nullable, Workbook, Worksheet } from '@univerjs/core';
import { getCurrentSheetDisabled$, SelectionManagerService } from '@univerjs/sheets';
import type { ICellPermission } from '@univerjs/sheets-selection-protection';
import { SelectionProtectionRuleModel, UniverSheetsSelectionProtectionPlugin } from '@univerjs/sheets-selection-protection';
import type { IAccessor } from '@wendellhu/redi';
import type { Observable } from 'rxjs';
import { combineLatestWith, map, merge, of, switchMap } from 'rxjs';

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

export function getCurrentRangeDisable$(accessor: IAccessor) {
    const sheetDisable$ = getCurrentSheetDisabled$(accessor);
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const selectionManagerService = accessor.get(SelectionManagerService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheet = workbook.getActiveSheet();
    const unitId = workbook.getUnitId();
    const subUnitId = worksheet.getSheetId();
    const selectionRuleModal = accessor.get(SelectionProtectionRuleModel);
    const subUnitRuleList = selectionRuleModal.getSubunitRuleList(unitId, subUnitId);

    const rangeDisable$ = merge(
        selectionManagerService.selectionMoveEnd$,
        selectionRuleModal.ruleChange$
    ).pipe(
        map(() => {
            const selections = selectionManagerService.getSelections();
            const selectionRanges = selections?.map((selection) => selection.range);
            const ruleRanges = subUnitRuleList.map((rule) => rule.ranges).flat();
            if (!selectionRanges?.length || !ruleRanges?.length) {
                return false;
            }
            const disable = selectionRanges?.some((range) => {
                for (let row = range.startRow; row <= range.endRow; row++) {
                    for (let col = range.startColumn; col <= range.endColumn; col++) {
                        const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
                        if (permission?.Edit === false) {
                            return true;
                        }
                    }
                }
                return false;
            });
            return disable;
        })
    );


    return sheetDisable$.pipe(
        combineLatestWith(rangeDisable$),
        map(([sheetDisable, rangeDisable]) => sheetDisable || rangeDisable)
    );
}

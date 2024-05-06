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

import type { ICellDataForSheetInterceptor, IRange, type RangeUnitPermissionType, Workbook } from '@univerjs/core';
import { IUniverInstanceService, UniverInstanceType } from '@univerjs/core';
import { getCurrentSheetDisabled$, SelectionManagerService } from '@univerjs/sheets';
import type { IAccessor } from '@wendellhu/redi';
import { map, merge } from 'rxjs';
import { SelectionProtectionRuleModel } from '@univerjs/sheets-selection-protection';

type ICellPermission = Record<RangeUnitPermissionType, boolean> & { ruleId?: string; ranges?: IRange[] };

export function isForceString(str: string): boolean {
    return str.startsWith("'");
}

export function extractStringFromForceString(str: string): string {
    return str.slice(1);
}

export function getCellDisabled$(accessor: IAccessor, type: RangeUnitPermissionType) {
    const selectionManagerService = accessor.get(SelectionManagerService);
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const permissionRuleModal = accessor.get(SelectionProtectionRuleModel);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheet = workbook.getActiveSheet();
    return merge(
        getCurrentSheetDisabled$(accessor),
        selectionManagerService.selectionMoveEnd$,
        permissionRuleModal.ruleChange$
    ).pipe(
        map(() => {
            const selections = selectionManagerService.getSelections();
            const ranges = selections?.map((selection) => selection.range);
            if (!ranges) return false;
            const disable = ranges?.every((range) => {
                for (let row = range.startRow; row <= range.endRow; row++) {
                    for (let col = range.startColumn; col <= range.endColumn; col++) {
                        const permission = (worksheet.getCell(row, col) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
                        if (permission?.[type] === false) return true;
                    }
                }
                return false;
            });
            return disable;
        })

    );
}

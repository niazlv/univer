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

import type { IRange, Workbook } from '@univerjs/core';
import { IUniverInstanceService, UniverInstanceType } from '@univerjs/core';
import type { IAccessor } from '@wendellhu/redi';
import { map } from 'rxjs';

import { WorksheetPermissionService } from './worksheet-permission.service';

export function getCurrentSheetDisabled$(accessor: IAccessor) {
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const worksheetPermissionService = accessor.get(WorksheetPermissionService);

    const unitId = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)?.getUnitId() ?? '';
    const sheetId = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)?.getActiveSheet().getSheetId() ?? '';

    return worksheetPermissionService.getEditPermission$({ unitId, subUnitId: sheetId })?.pipe(map((e) => !e));
}

export function getIdByRange(range: IRange) {
    const { startRow, startColumn, endRow, endColumn } = range;
    return `${startRow}-${startColumn}-${endRow}-${endColumn}`;
}

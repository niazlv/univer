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

import type { IRange, RangeUnitPermissionType } from '@univerjs/core';

export interface ISelectionProtectionRule {
    ranges: IRange[];
    permissionId: string;
    id: string;
    name: string;
    description?: string;
    unitType: UnitObject;
    unitId: string;
    subUnitId: string;
}

export type ICellPermission = Record<RangeUnitPermissionType, boolean> & { ruleId?: string;ranges?: IRange[] };
export type IObjectModel = Record<string, Record<string, ISelectionProtectionRule[]>>;

export type IModel = Map<string, Map<string, Map<string, ISelectionProtectionRule>>>;

export enum UnitObject {
    Unkonwn = 0,
    Workbook = 1,
    Worksheet = 2,
    SelectRange = 3,
    Document = 4,
    UNRECOGNIZED = -1,
}

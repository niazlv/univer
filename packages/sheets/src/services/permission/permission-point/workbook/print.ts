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

import type { IPermissionPoint, IUnitPermissionId } from '@univerjs/core';
import { PermissionStatus, PermissionType, UnitPermissionType } from '@univerjs/core';


export class WorkbookPrintPermission implements IPermissionPoint {
    id: IUnitPermissionId;
    value = true;
    type = PermissionType.WORK_BOOK;
    status = PermissionStatus.INIT;
    subType = UnitPermissionType.Print


    constructor(public unitId: string) {
        this.unitId = unitId;
        this.id = `${this.type}.${UnitPermissionType.Print}_${unitId}` as IUnitPermissionId;
    }
}
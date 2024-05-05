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

import type { ILogContext } from '@univerjs/core';
import { LifecycleStages, runOnLifecycle } from '@univerjs/core';
import { createIdentifier } from '@wendellhu/redi';
import { type ICollaborator, type ICreateRequest_SelectRangeObject, type IPermissionPoint, type IUnitRoleKV, UnitAction, type UnitObject } from '@univerjs/protocol';

export interface IAllowedRequest {
    permissionId: string;
    permissionType: UnitObject;
    unitId: string;
    actions: UnitAction[];
}
export interface IWorksheetPermissionIoService {
    create(config: ICreateRequest_SelectRangeObject, context?: ILogContext): Promise<string>;
    allowed(config: IAllowedRequest, context?: ILogContext): Promise<Record<string, boolean>>;
    batchAllowed(config: IAllowedRequest[], context?: ILogContext): Promise<Record<string, Record<string, boolean>>>;
    list(
        config: {
            unitId: string; permissionIdList: string[];
        }, context?: ILogContext): Promise<IPermissionPoint[]>;
    listRoles(type: string, context?: ILogContext): Promise<{ roles: IUnitRoleKV[]; actions: UnitAction[] }>;
    listCollaborators(config: {
        permissionId: string;
        unitId: string;
    }, context?: ILogContext): Promise<ICollaborator[]>;
}

export const IWorksheetPermissionIoService = createIdentifier<IWorksheetPermissionIoService>('IWorksheetPermissionIoService');
runOnLifecycle(LifecycleStages.Starting, IWorksheetPermissionIoService);


export const defaultSheetActions = [
    UnitAction.Edit,
    UnitAction.Copy,
];


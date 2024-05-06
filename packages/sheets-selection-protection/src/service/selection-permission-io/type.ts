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
import type { ICollaborator, ICreateRequest_SelectRangeObject, IUnitAction, IUnitRoleKV } from '@univerjs/protocol';

export interface IAllowedRequest {
    permissionId: string;
    permissionType: UnitObject;
    unitId: string;
    actions: UnitAction[];
}
export interface ISelectionPermissionIoService {
    create(config: ICreateRequest_SelectRangeObject, context?: ILogContext): Promise<string>;
    allowed(config: IAllowedRequest, context?: ILogContext): Promise<Record<string, boolean>>;
    batchAllowed(config: IAllowedRequest[], context?: ILogContext): Promise<Record<string, Record<string, boolean>>>;
    listRoles(type: string, context?: ILogContext): Promise<{ roles: IUnitRoleKV[]; actions: IUnitAction[] }>;
    listCollaborators(config: {
        permissionId: string;
        unitId: string;
    }, context?: ILogContext): Promise<ICollaborator[]>;
}

export const ISelectionPermissionIoService = createIdentifier<ISelectionPermissionIoService>('ISelectionPermissionIoService');
runOnLifecycle(LifecycleStages.Starting, ISelectionPermissionIoService);


// todo ybzky replace in univerjs/protocol
export enum UnitObject {
    Unkonwn = 0,
    Workbook = 1,
    Worksheet = 2,
    SelectRange = 3,
    Document = 4,
    UNRECOGNIZED = -1,
}

export enum UnitRole {
    Reader = 0,
    Editor = 1,
    Owner = 2,
    UNRECOGNIZED = -1,
}

export interface ICollaborator {
    id: string;
    role: UnitRole;
    subject: IUser | undefined;
}

export interface IUser {
    userID: string;
    name: string;
    avatar: string;
}

export enum UnitAction {
    View = 0,
    Edit = 1,
    ManageCollaborator = 2,
    Print = 3,
    Duplicate = 4,
    Comment = 5,
    Copy = 6,
    Share = 7,
    UNRECOGNIZED = -1,
}

export const defaultRangeActions = [
    UnitAction.Edit,
    UnitAction.Copy,
];

export const defaultSheetActions = [
    UnitAction.Edit,
    UnitAction.Copy,
];

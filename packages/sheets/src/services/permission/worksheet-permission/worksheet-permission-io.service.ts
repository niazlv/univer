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
import { RangeUnitPermissionType, SubUnitPermissionType, Tools } from '@univerjs/core';
import { IAllowedRequest, type ICollaborator, type IUnitRoleKV, type UnitAction, UnitRole } from '@univerjs/protocol';
import type { IWorksheetPermissionIoService } from './type';


export class WorksheetPermissionIoService implements IWorksheetPermissionIoService {
    async create(): Promise<string> {
        return Promise.resolve(Tools.generateRandomId(4));
    }

    /**
     * Record<permissionId, Record<IPermissionSubType, boolean>
     */
    async allowed(config: IAllowedRequest): Promise<Partial<Record<SubUnitPermissionType, boolean>>> {
        return Promise.resolve({
            [SubUnitPermissionType.Edit]: true,
            [SubUnitPermissionType.View]: true,
            [SubUnitPermissionType.ManageCollaborator]: true,
        });
    }

    async listCollaborators(config: { permissionId: string; unitId: string }): Promise<ICollaborator[]> {
        return Promise.resolve(
            [
                {
                    id: '1',
                    role: UnitRole.Owner,
                    subject: {
                        userID: '1',
                        name: 'DreamNum',
                        avatar: 'https://cnbabylon.com/assets/img/agents.png',
                    },
                },
                {
                    id: '2',
                    role: UnitRole.Editor,
                    subject: {
                        userID: '2',
                        name: 'UniverJS',
                        avatar: 'https://cnbabylon.com/assets/img/agents.png',
                    },
                },
                {
                    id: '3',
                    role: UnitRole.Reader,
                    subject: {
                        userID: '3',
                        name: 'ybzky',
                        avatar: 'https://cnbabylon.com/assets/img/agents.png',
                    },
                },
            ]);
    }

    async batchAllowed(config: IAllowedRequest[]): Promise<Record<string, Record<string, boolean>>> {
        const result: Record<string, Record<string, boolean>> = {};
        config.forEach((cur) => {
            result[cur.permissionId] = result[cur.permissionId] || {};
            result[cur.permissionId] = {
                [RangeUnitPermissionType.Edit]: false,
                [RangeUnitPermissionType.View]: true,
            };
        });
        return Promise.resolve(result);
    }

    async listRoles(type: string, context?: ILogContext | undefined): Promise<{ roles: IUnitRoleKV[]; actions: UnitAction[] }> {
        return {
            roles: [],
            actions: [],
        };
    }

    async list(config: {}) {
        return Promise.resolve([]);
    }
}

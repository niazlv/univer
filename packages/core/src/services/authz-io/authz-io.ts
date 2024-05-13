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

import type { IActionInfo, IAllowedRequest, IBatchAllowedResponse, ICollaborator, ICreateRequest, ICreateRequest_SelectRangeObject, IListPermPointRequest, IPermissionPoint, IUnitRoleKV, UnitAction } from '@univerjs/protocol';
import { UnitObject, UnitRole, UniverType } from '@univerjs/protocol';
import { Inject } from '@wendellhu/redi';
import { Tools } from '../../shared/tools';
import { IResourceManagerService } from '../resource-manager/type';
import { UserManagerService } from '../user-manager/user-manager.service';
import { createDefaultUser, isDevRole } from '../user-manager/const';


import type { IAuthzIoService } from './type';

/**
 * Do not use the mock implementation in a production environment as it is a minimal version.
 */
export class AuthzIoMockService implements IAuthzIoService {
    private _permissionMap: Map<string, ICreateRequest_SelectRangeObject & { objectType: UnitObject }> = new Map();
    constructor(
        @IResourceManagerService private _resourceManagerService: IResourceManagerService,
        @Inject(UserManagerService) private _userManagerService: UserManagerService
    ) {
        this._initSnapshot();
    }

    private _isRoot() {
        const user = this._userManagerService.currentUser;
        if (!user) {
            return false;
        }
        return isDevRole(user.userID, UnitRole.Owner);
    }

    private _initSnapshot() {
        this._resourceManagerService.registerPluginResource({
            toJson: (_unitId: string) => {
                const obj = [...this._permissionMap.keys()].reduce((r, k) => {
                    const v = this._permissionMap.get(k);
                    r[k] = v!;
                    return r;
                }, {} as Record<string, ICreateRequest_SelectRangeObject & { objectType: UnitObject }>);
                return JSON.stringify(obj);
            },
            parseJson: (json: string) => {
                return JSON.parse(json);
            },
            pluginName: 'SHEET_AuthzIoMockService_PLUGIN',
            businesses: [UniverType.UNIVER_SHEET, UniverType.UNIVER_DOC, UniverType.UNIVER_SLIDE],
            onLoad: (_unitId, resource) => {
                for (const key in resource) {
                    this._permissionMap.set(key, resource[key]);
                }
            },
            onUnLoad: () => {
                this._permissionMap.clear();
            },
        });
    }

    async create(config: ICreateRequest): Promise<string> {
        const id = Tools.generateRandomId(8);
        switch (config.objectType) {
            case UnitObject.SelectRange: {
                const params = config.selectRangeObject!;
                this._permissionMap.set(id, { ...params, objectType: config.objectType });
                break;
            }
            case UnitObject.Worksheet: {
                const params = config.worksheetObject!;
                this._permissionMap.set(id, { ...params, objectType: config.objectType });
            }
        }

        return id;
    }

    async allowed(config: IAllowedRequest): Promise<IActionInfo[]> {
        return config.actions.map((a) => ({
            action: a, allowed: this._isRoot(),
        }));
    }

    async batchAllowed(config: IAllowedRequest[]): Promise<IBatchAllowedResponse['objectActions']> {
        const user = this._userManagerService.currentUser;
        const defaultValue = config.map((item) => ({
            unitID: item.unitID,
            objectID: item.objectID,
            actions: item.actions.map((action) => ({
                action,
                allowed: false,
            })),
        }));
        if (!user) {
            return defaultValue;
        }
        if (isDevRole(user.userID, UnitRole.Owner)) {
            return config.map((item) => ({
                unitID: item.unitID,
                objectID: item.objectID,
                actions: item.actions.map((action) => ({
                    action,
                    allowed: true,
                })),
            }));
        }
        return defaultValue;
    }

    async list(config: IListPermPointRequest): Promise<IPermissionPoint[]> {
        const result: IPermissionPoint[] = [];
        config.objectIDs.forEach((objectID) => {
            const rule = this._permissionMap.get(objectID);
            if (rule) {
                const item = {
                    objectID,
                    unitID: config.unitID,
                    objectType: rule!.objectType,
                    name: rule!.name,
                    shareOn: false,
                    shareRole: UnitRole.Owner,
                    creator: createDefaultUser(UnitRole.Owner),
                    strategies: [],
                    actions: config.actions.map((a) => ({ action: a, allowed: this._isRoot() })),
                };
                result.push(item);
            }
        });
        return result;
    }

    async listCollaborators(): Promise<ICollaborator[]> {
        return [];
    }

    async listRoles(): Promise<{ roles: IUnitRoleKV[]; actions: UnitAction[] }> {
        return {
            roles: [],
            actions: [],
        };
    }

    async deleteCollaborator(): Promise<void> {
        return undefined;
    }

    async update(): Promise<void> {
        return undefined;
    }

    async updateCollaborator(): Promise<void> {
        return undefined;
    }

    async createCollaborator(): Promise<void> {
        return undefined;
    }
}

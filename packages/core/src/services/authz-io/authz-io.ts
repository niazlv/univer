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

import type { IActionInfo, ICollaborator, IPermissionPoint, IUnitRoleKV, UnitAction } from '@univerjs/protocol';
import type { ObjectActionInfo } from '@univerjs/protocol/lib/types/ts/v1/authz.js';


import type { IAuthzIoService } from './type';

export class AuthzIoMockService implements IAuthzIoService {
    async create(): Promise<string> {
        return '';
    }

    async allowed(): Promise<IActionInfo[]> {
        return [];
    }

    async batchAllowed(): Promise<ObjectActionInfo[]> {
        return [];
    }

    async list(): Promise<IPermissionPoint[]> {
        return [];
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

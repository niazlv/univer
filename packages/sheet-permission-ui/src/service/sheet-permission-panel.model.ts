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

import type { Nullable } from '@univerjs/core';
import { LifecycleStages, OnLifecycle } from '@univerjs/core';
import { UnitObject } from '@univerjs/protocol';
import type { IWorksheetProtectionRule } from '@univerjs/sheets';
import type { ISelectionProtectionRule } from '@univerjs/sheets-selection-protection';
import { BehaviorSubject } from 'rxjs';

const DEFAULT_RANGE_RULE: ISelectionProtectionRule = {
    name: '',
    unitId: '',
    subUnitId: '',
    permissionId: '',
    unitType: UnitObject.Unkonwn,
    id: '',
    ranges: [],
};

export enum viewState {
    othersCanView = 'othersCanView',
    noOneElseCanView = 'noOneElseCanView',

}

type IPermissionPanelBaseRule = ISelectionProtectionRule | IWorksheetProtectionRule;

export type IPermissionPanelRule = IPermissionPanelBaseRule & { viewStatus?: viewState };


@OnLifecycle(LifecycleStages.Starting, SheetPermissionPanelModel)
export class SheetPermissionPanelModel {
    private _rule: IPermissionPanelRule = DEFAULT_RANGE_RULE;
    private _rule$ = new BehaviorSubject(this._rule);
    private _oldRule: Nullable<IPermissionPanelRule>;

    rule$ = this._rule$.asObservable();

    get rule() {
        return this._rule;
    }

    setRule(ruleObj: Partial<IPermissionPanelRule>) {
        this._rule = { ...this._rule, ...ruleObj };
        this._rule$.next(this._rule);
    }

    resetRule() {
        this._rule = DEFAULT_RANGE_RULE;
    }

    get oldRule() {
        return this._oldRule;
    }

    setOldRule(ruleObj: Nullable<IPermissionPanelRule>) {
        this._oldRule = ruleObj;
    }
}

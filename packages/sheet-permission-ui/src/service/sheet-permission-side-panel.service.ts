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

import { Disposable } from '@univerjs/core';
import type { ISelectionProtectionRule } from '@univerjs/sheets-selection-protection';
import { UnitObject } from '@univerjs/sheets-selection-protection/model/type.js';
import { BehaviorSubject } from 'rxjs';

export enum viewState {
    othersCanView = 'othersCanView',
    noOneElseCanView = 'noOneElseCanView',

}

export const DEFAULT_RULE = {
    name: '',
    unitId: '',
    subUnitId: '',
    permissionId: '',
    unitType: UnitObject.Unkonwn,
    id: '',
    viewStatus: viewState.othersCanView,
};

export interface ISelectionProtectionRuleWithViewStatus extends ISelectionProtectionRule {
    viewStatus: viewState;
}

export class SheetPermissionPanelService extends Disposable {
    private _rule: ISelectionProtectionRuleWithViewStatus = DEFAULT_RULE;

    private _rule$ = new BehaviorSubject(this._rule);

    private _showDetail = true;

    private _showDetail$ = new BehaviorSubject(this._showDetail);


    private _isFromSheetBar = false;

    private _oldRule: ISelectionProtectionRuleWithViewStatus = DEFAULT_RULE;

    rule$ = this._rule$.asObservable();
    showDetail$ = this._showDetail$.asObservable();

    setRule(ruleObj: Partial<ISelectionProtectionRuleWithViewStatus>) {
        this._rule = { ...this._rule, ...ruleObj };
        this._rule$.next(this._rule);
    }

    resetRule() {
        this._rule = DEFAULT_RULE;
        this._rule$.next(this._rule);
    }

    get rule() {
        return this._rule;
    }

    get oldRule() {
        return this._oldRule;
    }

    setOldRule(rule: ISelectionProtectionRuleWithViewStatus) {
        this._oldRule = rule;
    }

    get showDetail() {
        return this._showDetail;
    }

    setShowDetail(showDetail: boolean) {
        this._showDetail = showDetail;
        this._showDetail$.next(showDetail);
    }

    get isFromSheetBar() {
        return this._isFromSheetBar;
    }

    setIsFromSheetBar(isFromSheetBar: boolean) {
        this._isFromSheetBar = isFromSheetBar;
    }
}

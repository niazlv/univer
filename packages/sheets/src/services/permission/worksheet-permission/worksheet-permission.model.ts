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

import { Subject } from 'rxjs';
import { LifecycleStages, OnLifecycle } from '@univerjs/core';
import type { IModel, IObjectModel, IWorksheetProtectionRule } from '../type';

type IRuleChangeType = 'add' | 'set' | 'delete';

@OnLifecycle(LifecycleStages.Starting, WorksheetProtectionRuleModel)
export class WorksheetProtectionRuleModel {
    /**
     *
     * Map<unitId, Map<subUnitId, Map<ruleId, IWorksheetProtectionRule>>>
     */
    private _model: IModel = new Map();

    private _ruleChange = new Subject<{
        unitId: string;
        subUnitId: string;
        rule: IWorksheetProtectionRule;
        oldRule?: IWorksheetProtectionRule;
        type: IRuleChangeType;
    }>();

    ruleChange$ = this._ruleChange.asObservable();

    addRule(unitId: string, rule: IWorksheetProtectionRule) {
        this._model.set(rule.subUnitId, rule);
        this._ruleChange.next({ unitId, rule, type: 'add', subUnitId: rule.subUnitId });
    }

    deleteRule(unitId: string, subUnitId: string) {
        const rule = this._model.get(subUnitId);
        if (rule) {
            this._model.delete(subUnitId);
            this._ruleChange.next({ unitId, rule, type: 'delete', subUnitId });
        }
    }

    setRule(unitId: string, subUnitId: string, rule: IWorksheetProtectionRule) {
        const oldRule = this.getRule(unitId, subUnitId);
        if (oldRule) {
            this._model.set(subUnitId, rule);
            this._ruleChange.next({ unitId, oldRule, rule, type: 'set', subUnitId });
        }
    }

    getRule(unitId: string, subUnitId: string) {
        return this._model?.get(subUnitId);
    }


    toObject() {
        const result: IObjectModel = {};
        const subUnitKeys = [...this._model.keys()];
        subUnitKeys.forEach((subUnitId) => {
            const subUnitValue = this._model.get(subUnitId)!;
            result[subUnitId] = subUnitValue;
        });
        return result;
    }

    fromObject(obj: IObjectModel) {
        const result: IModel = new Map();
        Object.keys(obj).forEach((subUnitId) => {
            const subUnitRule = obj[subUnitId];
            result.set(subUnitId, subUnitRule);
        });
        this._model = result;
    }

    deleteUnitModel() {
        this._model.clear();
    }
}

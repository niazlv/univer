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

import type { ICommand } from '@univerjs/core';
import { CommandType, ICommandService, IUndoRedoService } from '@univerjs/core';
import { SelectionProtectionRuleModel } from '../../model';
import { AddSelectionProtection } from '../mutation/add-selection-protection.mutation';
import { DeleteSelectionProtection } from '../mutation/delete-selection-protection.mutation';
import type { IAddRangeProtectionParams } from './type';

export const AddRangeProtectionCommand: ICommand<IAddRangeProtectionParams> = {
    type: CommandType.COMMAND,
    id: 'sheets.command.add-range-protection',
    async handler(accessor, params) {
        if (!params) {
            return false;
        }
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const selectionProtectionModel = accessor.get(SelectionProtectionRuleModel);
        const { rule, permissionId } = params;

        const { unitId, subUnitId, ranges, name, description } = rule;
        const rules = [{
            ranges,
            permissionId,
            id: selectionProtectionModel.createRuleId(unitId, subUnitId),
            name,
            description,
        }];

        const result = await commandService.executeCommand(AddSelectionProtection.id, {
            unitId,
            subUnitId,
            rules,
        });

        if (result) {
            const redoMutations = [{ id: AddSelectionProtection.id, params: { unitId, subUnitId, rules } }];
            const undoMutations = [{ id: DeleteSelectionProtection.id, params: { unitId, subUnitId, ruleIds: rules.map((rule) => rule.id) } }];
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                redoMutations,
                undoMutations,
            });
        }

        return true;
    },
};

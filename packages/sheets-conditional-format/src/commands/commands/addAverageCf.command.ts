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

import type { ICommand, IRange } from '@univerjs/core';
import {
    CommandType,
    ICommandService,
    IUniverInstanceService,
} from '@univerjs/core';
import { ConditionalFormatRuleModel } from '../../models/conditional-format-rule-model';
import type { IAverageHighlightCell, IConditionFormatRule } from '../../models/type';
import { RuleType, SubRuleType } from '../../base/const';
import type { IAddConditionalRuleMutationParams } from '../mutations/addConditionalRule.mutation';
import { addConditionalRuleMutation } from '../mutations/addConditionalRule.mutation';

interface IAddAverageCfParams {
    ranges: IRange[];
    stopIfTrue?: boolean;
    style: IAverageHighlightCell['style'];
    operator: IAverageHighlightCell['operator'];
}
export const addAverageCfCommand: ICommand<IAddAverageCfParams> = {
    type: CommandType.COMMAND,
    id: 'sheet.command.add-average-conditional-rule',
    handler(accessor, params) {
        if (!params) {
            return false;
        }
        const { ranges, style, stopIfTrue, operator } = params;
        const conditionalFormatRuleModel = accessor.get(ConditionalFormatRuleModel);
        const commandService = accessor.get(ICommandService);

        const univerInstanceService = accessor.get(IUniverInstanceService);
        const workbook = univerInstanceService.getCurrentUniverSheetInstance();
        const worksheet = workbook.getActiveSheet();
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();
        const cfId = conditionalFormatRuleModel.createCfId(unitId, subUnitId);
        const rule: IConditionFormatRule = { ranges, cfId, stopIfTrue: !!stopIfTrue,
                                             rule: {
                                                 type: RuleType.highlightCell,
                                                 subType: SubRuleType.average,
                                                 operator,
                                                 style,
                                             } };
        commandService.executeCommand(addConditionalRuleMutation.id, { unitId, subUnitId, rule } as IAddConditionalRuleMutationParams);
        return true;
    },
};

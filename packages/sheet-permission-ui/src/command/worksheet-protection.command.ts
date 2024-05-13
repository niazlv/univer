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

import type { ICommand, Workbook } from '@univerjs/core';
import { CommandType, ICommandService, IUndoRedoService, IUniverInstanceService } from '@univerjs/core';

import { AddWorksheetProtectionMutation } from '@univerjs/sheets/commands/mutations/add-worksheet-protection.mutation.js';
import { DeleteWorksheetProtectionMutation } from '@univerjs/sheets/commands/mutations/delete-worksheet-protection.mutation.js';
import { WorksheetProtectionRuleModel } from '@univerjs/sheets/services/permission/worksheet-permission/worksheet-permission.model.js';
import { UniverType } from '@univerjs/protocol';
import type { IAddWorksheetProtectionParams, IDeleteWorksheetProtectionParams, ISetWorksheetProtectionParams } from './type';

export const AddWorksheetProtectionCommand: ICommand<IAddWorksheetProtectionParams> = {
    type: CommandType.COMMAND,
    id: 'sheets.command.add-worksheet-protection',
    async handler(accessor, params) {
        if (!params) {
            return false;
        }
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const { rule, unitId } = params;
        const subUnitId = rule.subUnitId;

        const result = await commandService.executeCommand(AddWorksheetProtectionMutation.id, {
            unitId,
            rule,
        });

        if (result) {
            const redoMutations = [{ id: AddWorksheetProtectionMutation.id, params: { unitId, rule } }];
            const undoMutations = [{ id: DeleteWorksheetProtectionMutation.id, params: { unitId, subUnitId } }];
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                redoMutations,
                undoMutations,
            });
        }

        return true;
    },
};

export const DeleteWorksheetProtectionCommand: ICommand<IDeleteWorksheetProtectionParams> = {
    type: CommandType.COMMAND,
    id: 'sheets.command.delete-worksheet-protection',
    async handler(accessor, params) {
        if (!params) {
            return false;
        }
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const { rule, unitId } = params;
        const subUnitId = rule.subUnitId;

        const result = await commandService.executeCommand(DeleteWorksheetProtectionCommand.id, {
            unitId,
            subUnitId,
        });

        if (result) {
            const redoMutations = [{ id: DeleteWorksheetProtectionCommand.id, params: { unitId, subUnitId } }];
            const undoMutations = [{ id: AddWorksheetProtectionCommand.id, params: { unitId, rule } }];
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                redoMutations,
                undoMutations,
            });
        }

        return true;
    },
};

export const SetWorksheetProtectionCommand: ICommand<ISetWorksheetProtectionParams> = {
    type: CommandType.COMMAND,
    id: 'sheets.command.set-worksheet-protection',
    async handler(accessor, params) {
        if (!params) {
            return false;
        }
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const { rule, unitId } = params;
        const subUnitId = rule.subUnitId;

        const result = await commandService.executeCommand(DeleteWorksheetProtectionCommand.id, {
            unitId,
            subUnitId,
        });

        if (result) {
            const redoMutations = [{ id: DeleteWorksheetProtectionCommand.id, params: { unitId, subUnitId } }];
            const undoMutations = [{ id: AddWorksheetProtectionCommand.id, params: { unitId, rule } }];
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                redoMutations,
                undoMutations,
            });
        }

        return true;
    },
};


export const DeleteWOrksheetProtectionFormSheetBarCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheets.command.delete-worksheet-protection-from-sheet-bar',
    async handler(accessor, params) {
        if (!params) {
            return false;
        }
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);

        const worksheetProtectionRuleModel = accessor.get(WorksheetProtectionRuleModel);
        const univerInstanceService = accessor.get(IUniverInstanceService);

        const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverType.UNIVER_SHEET)!;
        const worksheet = workbook?.getActiveSheet();
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();

        const rule = worksheetProtectionRuleModel.getRule(unitId, subUnitId);

        const result = await commandService.executeCommand(DeleteWorksheetProtectionCommand.id, {
            unitId,
            subUnitId,
        });

        if (result) {
            const redoMutations = [{ id: DeleteWorksheetProtectionCommand.id, params: { unitId, subUnitId } }];
            const undoMutations = [{ id: AddWorksheetProtectionCommand.id, params: { unitId, rule } }];
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                redoMutations,
                undoMutations,
            });
        }

        return true;
    },
};

export const ChangeSheetProtectionFromSheetBarCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheets.command.change-sheet-protection-from-sheet-bar',
    async handler(accessor) {
        const commandService = accessor.get(ICommandService);
        await commandService.executeCommand('sheet-permission.operation.openDialog');
        return true;
    },
};

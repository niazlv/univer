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
import { CommandType, ICommandService, IUndoRedoService, IUniverInstanceService, Rectangle, UniverInstanceType } from '@univerjs/core';
import { AddSelectionProtection, DeleteSelectionProtection, SelectionProtectionRuleModel } from '@univerjs/sheets-selection-protection';
import { SetSelectionProtection } from '@univerjs/sheets-selection-protection/commands/index.js';
import { SelectionManagerService } from '@univerjs/sheets';
import { SheetPermissionPanelService } from '../service';
import { SheetPermissionOpenPanelOperation } from '../operation/sheet-permission-open-panel.operation';
import type { IAddSheetPermissionParams, IDeleteSheetPermissionParams, ISetSheetPermissionParams } from './type';

export const AddSheetPermissionFromContextMenuCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheets.command.add-sheet-permission-from-context-menu',
    async handler(accessor) {
        const commandService = accessor.get(ICommandService);
        await commandService.executeCommand(SheetPermissionOpenPanelOperation.id);
        return true;
    },
};

export const ViewSheetPermissionFromContextMenuCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheets.command.view-sheet-permission-from-context-menu',
    async handler(accessor) {
        const commandService = accessor.get(ICommandService);
        const sheetPermissionPanelService = accessor.get(SheetPermissionPanelService);
        sheetPermissionPanelService.setShowDetail(false);
        await commandService.executeCommand(SheetPermissionOpenPanelOperation.id);
        return true;
    },
};

export const AddSheetPermissionFromSheetBarCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheets.command.add-sheet-permission-from-sheet-bar',
    async handler(accessor) {
        const commandService = accessor.get(ICommandService);
        await commandService.executeCommand(SheetPermissionOpenPanelOperation.id, { fromSheetBar: true });
        return true;
    },
};

export const ViewSheetPermissionFromSheetBarCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheets.command.view-sheet-permission-from-sheet-bar',
    async handler(accessor) {
        const commandService = accessor.get(ICommandService);
        const sheetPermissionPanelService = accessor.get(SheetPermissionPanelService);
        sheetPermissionPanelService.setShowDetail(false);
        await commandService.executeCommand(SheetPermissionOpenPanelOperation.id);
        return true;
    },
};

export const ChangeSheetPermissionFromSheetBarCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheets.command.change-sheet-permission-from-sheet-bar',
    async handler(accessor) {
        const commandService = accessor.get(ICommandService);
        await commandService.executeCommand('sheet-permission.operation.openDialog');
        return true;
    },
};

export const AddSheetPermissionCommand: ICommand<IAddSheetPermissionParams> = {
    type: CommandType.COMMAND,
    id: 'sheets.command.add-sheet-permission',
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

export const DeleteSheetPermissionCommand: ICommand<IDeleteSheetPermissionParams> = {
    type: CommandType.COMMAND,
    id: 'sheets.command.delete-sheet-permission',
    async handler(accessor, params) {
        if (!params) {
            return false;
        }
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const { unitId, subUnitId, rule } = params;

        const redoMutationParam = {
            unitId,
            subUnitId,
            ruleIds: [rule.id],
        };
        const result = await commandService.executeCommand(DeleteSelectionProtection.id, redoMutationParam);

        if (result) {
            undoRedoService.pushUndoRedo({
                unitID: unitId,
                redoMutations: [{ id: DeleteSelectionProtection.id, params: redoMutationParam }],
                undoMutations: [{ id: AddSelectionProtection.id, params: { unitId, subUnitId, rules: [rule] } }],
            });
        }

        return true;
    },
};

export const SetSheetPermissionCommand: ICommand<ISetSheetPermissionParams> = {
    type: CommandType.COMMAND,
    id: 'sheets.command.set-sheet-permission',
    async handler(accessor, params) {
        if (!params) {
            return false;
        }
        const commandService = accessor.get(ICommandService);
        const selectionProtectionModel = accessor.get(SelectionProtectionRuleModel);
        const sheetPermissionPanelService = accessor.get(SheetPermissionPanelService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const { rule, permissionId } = params;

        const { unitId, subUnitId, ranges, name, description } = rule;

        if (rule.id) {
            const redoMutationParam = {
                unitId,
                subUnitId,
                ruleId: rule.id,
                rule: {
                    ranges,
                    permissionId,
                    id: selectionProtectionModel.createRuleId(unitId, subUnitId),
                    name,
                    description,
                },
            };
            const result = await commandService.executeCommand(SetSelectionProtection.id, redoMutationParam);

            if (result) {
                const redoMutations = [{
                    id: SetSelectionProtection.id, params: redoMutationParam,
                }];
                const undoMutations = [{
                    id: SetSelectionProtection.id, params: {
                        unitId,
                        subUnitId,
                        ruleId: rule.id,
                        rule: sheetPermissionPanelService.oldRule,
                    },
                }];
                undoRedoService.pushUndoRedo({
                    unitID: unitId,
                    redoMutations,
                    undoMutations,
                });
            }
        }
        return true;
    },
};


export const deleteSheetPermissionFromContextMenuCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheets.command.delete-sheet-permission-from-context-menu',
    async handler(accessor) {
        const commandService = accessor.get(ICommandService);
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const selectionManagerService = accessor.get(SelectionManagerService);
        const selectRange = selectionManagerService.getLast()?.range;
        if (!selectRange) {
            return false;
        }
        const sheetPermissionRuleModal = accessor.get(SelectionProtectionRuleModel);
        const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
        const worksheet = workbook.getActiveSheet()!;
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();
        const subRuleList = sheetPermissionRuleModal.getSubunitRuleList(unitId, subUnitId);
        const rule = subRuleList.find((item) => {
            return item.ranges.some((range) => Rectangle.intersects(range, selectRange));
        });

        if (rule) {
            const redoMutationParam = {
                unitId,
                subUnitId,
                ruleIds: [rule.id],
            };
            const result = await commandService.executeCommand(DeleteSelectionProtection.id, redoMutationParam);
            if (result) {
                undoRedoService.pushUndoRedo({
                    unitID: unitId,
                    redoMutations: [{ id: DeleteSelectionProtection.id, params: redoMutationParam }],
                    undoMutations: [{ id: AddSelectionProtection.id, params: { unitId, subUnitId, rules: [rule] } }],
                });
            }
            return true;
        } else {
            return false;
        }
    },

};

export const SetSheetPermissionFromContextMenuCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheets.command.set-sheet-permission-from-context-menu',
    async handler(accessor) {
        const commandService = accessor.get(ICommandService);
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const selectionManagerService = accessor.get(SelectionManagerService);
        const selectRange = selectionManagerService.getLast()?.range;
        if (!selectRange) {
            return false;
        }
        const sheetPermissionRuleModal = accessor.get(SelectionProtectionRuleModel);
        const sheetPermissionPanelService = accessor.get(SheetPermissionPanelService);
        const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
        const worksheet = workbook.getActiveSheet()!;
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();
        const subRuleList = sheetPermissionRuleModal.getSubunitRuleList(unitId, subUnitId);
        const rule = subRuleList.find((item) => {
            return item?.ranges?.some((range) => Rectangle.intersects(range, selectRange));
        });

        if (rule) {
            sheetPermissionPanelService.setShowDetail(true);
            const oldRule = {
                ...rule,
                unitId,
                subUnitId,
            };
            sheetPermissionPanelService.setRule(oldRule);
            sheetPermissionPanelService.setOldRule(oldRule);
            await commandService.executeCommand(SheetPermissionOpenPanelOperation.id);
            return true;
        } else {
            return false;
        }
    },
};

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

import { Button } from '@univerjs/design';
import { useDependency } from '@wendellhu/redi/react-bindings';
import React from 'react';
import { ISidebarService, useObservable } from '@univerjs/ui';
import { IAuthzIoService, ICommandService, LocaleService } from '@univerjs/core';
import { UnitObject, UnitRole } from '@univerjs/protocol';
import { AddRangeProtectionCommand, type ISelectionProtectionRule, SelectionProtectionRuleModel } from '@univerjs/sheets-selection-protection';
import { WorksheetProtectionRuleModel } from '@univerjs/sheets';
import { SheetPermissionUserManagerService } from '../../service';
import { defaultWorksheetUnitActionList, UNIVER_SHEET_PERMISSION_PANEL, UNIVER_SHEET_PERMISSION_PANEL_FOOTER } from '../../const';
import { AddWorksheetProtectionCommand } from '../../command/worksheet-protection.command';
import { SheetPermissionPanelModel, viewState } from '../../service/sheet-permission-panel.model';
import styles from './index.module.less';

export const SheetPermissionPanelDetailFooter = () => {
    const sheetPermissionPanelModel = useDependency(SheetPermissionPanelModel);
    const activeRule = useObservable(sheetPermissionPanelModel.rule$, sheetPermissionPanelModel.rule);
    const sidebarService = useDependency(ISidebarService);
    const authzIoService = useDependency(IAuthzIoService);
    const localeService = useDependency(LocaleService);
    const commandService = useDependency(ICommandService);
    const sheetPermissionUserManagerService = useDependency(SheetPermissionUserManagerService);
    const worksheetProtectionRuleModel = useDependency(WorksheetProtectionRuleModel);
    const selectionProtectionRuleModel = useDependency(SelectionProtectionRuleModel);


    return (
        <div className={styles.sheetPermissionPanelFooter}>
            <Button
                type="primary"
                onClick={async () => {
                    if (!activeRule.name) return;
                    let result: boolean = false;
                    const collaborators = sheetPermissionUserManagerService.selectUserList;
                    if (activeRule.viewStatus === viewState.othersCanView) {
                        sheetPermissionUserManagerService.userList.forEach((user) => {
                            const hasInCollaborators = collaborators.some((collaborator) => collaborator.id === user.id);
                            if (!hasInCollaborators) {
                                const userCanRead = {
                                    ...user,
                                    role: UnitRole.Reader,
                                };
                                collaborators.push(userCanRead);
                            }
                        });
                    }
                    if (activeRule.permissionId) {
                        const { unitId, subUnitId } = activeRule;
                        if (activeRule.unitType === UnitObject.Worksheet) {
                            worksheetProtectionRuleModel.setRule(unitId, subUnitId, activeRule);
                        } else if (activeRule.unitType === UnitObject.SelectRange) {
                            const { id } = activeRule as ISelectionProtectionRule;
                            selectionProtectionRuleModel.setRule(unitId, subUnitId, id, activeRule as ISelectionProtectionRule);
                        }
                        authzIoService.putCollaborators({
                            objectID: activeRule.permissionId,
                            unitID: unitId,
                            collaborators,
                        });
                    } else {
                        if (activeRule.unitType === UnitObject.Worksheet) {
                            const permissionId = await authzIoService.create({
                                worksheetObject: {
                                    collaborators,
                                    unitID: activeRule.unitId,
                                    name: activeRule.name,
                                    strategies: defaultWorksheetUnitActionList.map((action) => ({ role: UnitRole.Editor, action })),
                                },
                                objectType: UnitObject.Worksheet,
                            });
                            const { ranges = [], ...sheetRule } = activeRule as ISelectionProtectionRule;
                            sheetRule.permissionId = permissionId;
                            result = await commandService.executeCommand(AddWorksheetProtectionCommand.id, {
                                rule: sheetRule,
                                unitId: activeRule.unitId,
                            });
                        } else if (activeRule.unitType === UnitObject.SelectRange) {
                            const permissionId = await authzIoService.create({
                                selectRangeObject: {
                                    collaborators,
                                    unitID: activeRule.unitId,
                                    name: activeRule.name,
                                },
                                objectType: UnitObject.SelectRange,
                            });
                            result = await commandService.executeCommand(AddRangeProtectionCommand.id, {
                                rule: activeRule,
                                permissionId,
                            });
                        }
                    }
                    if (result) {
                        sheetPermissionPanelModel.resetRule();
                        sheetPermissionUserManagerService.setSelectUserList([]);
                        const sidebarProps = {
                            header: { title: '保护行列' },
                            children: {
                                label: UNIVER_SHEET_PERMISSION_PANEL,
                                showDetail: false,
                            },
                            width: 320,
                            footer: {
                                label: UNIVER_SHEET_PERMISSION_PANEL_FOOTER,
                                showDetail: false,
                            },
                        };
                        sidebarService.open(sidebarProps);
                    }
                }}
            >
                {localeService.t('permission.button.confirm')}
            </Button>
            <Button
                className={styles.sheetPermissionPanelFooterCancel}
                onClick={() => {
                    sheetPermissionPanelModel.resetRule();
                    sheetPermissionUserManagerService.setSelectUserList([]);
                    sidebarService.close();
                }}
            >
                {localeService.t('permission.button.cancel')}
            </Button>
        </div>
    );
};

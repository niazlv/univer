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
import { ICommandService, LocaleService } from '@univerjs/core';
import { ISelectionPermissionIoService, UnitRole } from '@univerjs/sheets-selection-protection';
import { SheetPermissionPanelService, SheetPermissionUserManagerService } from '../../service';
import { UNIVER_SHEET_PERMISSION_PANEL_ADD_FOOTER, UNIVER_SHEET_PERMISSION_PANEL_LIST } from '../../const';
import { AddSheetPermissionCommand, SetSheetPermissionCommand } from '../../command/sheet-permission.command';
import { viewState } from '../../service/sheet-permission-side-panel.service';
import styles from './index.module.less';

export const SheetPermissionPanelFooter = () => {
    const sheetPermissionPanelService = useDependency(SheetPermissionPanelService);
    const activeRule = useObservable(sheetPermissionPanelService.rule$, sheetPermissionPanelService.rule);
    const sidebarService = useDependency(ISidebarService);
    const selectionPermissionIoService = useDependency(ISelectionPermissionIoService);
    const localeService = useDependency(LocaleService);
    const commandService = useDependency(ICommandService);
    const sheetPermissionUserManagerService = useDependency(SheetPermissionUserManagerService);


    return (
        <div className={styles.sheetPermissionPanelFooter}>
            <Button
                type="primary"
                onClick={async () => {
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
                        const permissionId = await selectionPermissionIoService.create({
                            collaborators,
                            unitID: activeRule.unitId,
                        });
                        result = await commandService.executeCommand(SetSheetPermissionCommand.id, {
                            rule: activeRule,
                            permissionId,
                        });
                    } else {
                        const permissionId = await selectionPermissionIoService.create({
                            collaborators,
                            unitID: activeRule.unitId,
                        });
                        result = await commandService.executeCommand(AddSheetPermissionCommand.id, {
                            rule: activeRule,
                            permissionId,
                        });
                    }
                    if (result) {
                        sheetPermissionPanelService.setShowDetail(false);
                        sheetPermissionPanelService.resetRule();
                        sheetPermissionUserManagerService.setSelectUserList([]);
                        sidebarService.open({
                            header: { title: '保护行列' },
                            children: { label: UNIVER_SHEET_PERMISSION_PANEL_LIST },
                            width: 320,
                            footer: { label: UNIVER_SHEET_PERMISSION_PANEL_ADD_FOOTER },
                        });
                    }
                }}
            >
                {localeService.t('permission.button.confirm')}
            </Button>
            <Button
                className={styles.sheetPermissionPanelFooterCancel}
                onClick={() => {
                    sheetPermissionPanelService.resetRule();
                    sheetPermissionUserManagerService.setSelectUserList([]);
                    sidebarService.close();
                }}
            >
                {localeService.t('permission.button.cancel')}
            </Button>
        </div>
    );
};

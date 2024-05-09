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

import React, { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { Avatar, Tooltip } from '@univerjs/design';
import { useDependency } from '@wendellhu/redi/react-bindings';
import type { ISelectionProtectionRule } from '@univerjs/sheets-selection-protection';
import { SelectionProtectionRuleModel } from '@univerjs/sheets-selection-protection';
import type { Workbook } from '@univerjs/core';
import { IAuthzIoService, ICommandService, IUniverInstanceService, LocaleService, UniverInstanceType } from '@univerjs/core';
import type { IWorksheetProtectionRule } from '@univerjs/sheets';
import { WorkbookPermissionService, WorksheetProtectionRuleModel } from '@univerjs/sheets';
import { ISidebarService } from '@univerjs/ui';
import { merge } from 'rxjs';
import type { IPermissionPoint } from '@univerjs/protocol';
import { UnitAction } from '@univerjs/protocol';
import { DeleteRangeSelectionCommand } from '../../command/range-protection.command';
import { UNIVER_SHEET_PERMISSION_PANEL, UNIVER_SHEET_PERMISSION_PANEL_FOOTER } from '../../const';
import type { IPermissionPanelRule } from '../../service/sheet-permission-panel.model';
import { SheetPermissionPanelModel } from '../../service/sheet-permission-panel.model';
import styles from './index.module.less';

type IRuleItem = ISelectionProtectionRule | IWorksheetProtectionRule;
export const SheetPermissionPanelList = () => {
    const [isCurrentSheet, setIsCurrentSheet] = useState(true);
    const [forceUpdateFlag, setForceUpdateFlag] = useState(false);
    const sheetPermissionPanelModel = useDependency(SheetPermissionPanelModel);
    const localeService = useDependency(LocaleService);
    const selectionProtectionModel = useDependency(SelectionProtectionRuleModel);
    const worksheetProtectionModel = useDependency(WorksheetProtectionRuleModel);
    const univerInstanceService = useDependency(IUniverInstanceService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const unitId = workbook.getUnitId();
    const commandService = useDependency(ICommandService);
    const sidebarService = useDependency(ISidebarService);
    const authzIoService = useDependency(IAuthzIoService);
    const workbookPermissionService = useDependency(WorkbookPermissionService);

    const getRuleList = useCallback(async (isCurrentSheet: boolean) => {
        const worksheet = workbook.getActiveSheet()!;
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();

        const allRangePermissionId: string[] = [];
        const allSheetPermissionId: string[] = [];

        workbook.getSheets().forEach((sheet) => {
            const sheetId = sheet.getSheetId();
            const rules = selectionProtectionModel.getSubunitRuleList(unitId, sheetId);
            rules.forEach((rule) => {
                allRangePermissionId.push(rule.permissionId);
            });
            const worksheetPermissionId = worksheetProtectionModel.getRule(unitId, sheetId)?.permissionId;
            if (worksheetPermissionId) {
                allSheetPermissionId.push(worksheetPermissionId);
            }
        });

        const allPermissionId = [...allRangePermissionId, ...allSheetPermissionId];

        const allPermissionRule = await authzIoService.list({
            objectIDs: allPermissionId,
            unitID: unitId,
            actions: [UnitAction.View, UnitAction.Edit],
        });


        const subUnitPermissionIds = selectionProtectionModel.getSubunitRuleList(unitId, subUnitId).map((item) => item.permissionId);
        const sheetPermissionId = worksheetProtectionModel.getRule(unitId, subUnitId)?.permissionId;
        if (sheetPermissionId) {
            subUnitPermissionIds.push(sheetPermissionId);
        }
        const subUnitRuleList = allPermissionRule.filter((item) => {
            return subUnitPermissionIds.includes(item.objectID) || item.objectID === worksheetProtectionModel.getRule(unitId, subUnitId)?.permissionId;
        });

        return isCurrentSheet ? subUnitRuleList : allPermissionRule;
    }, [authzIoService, selectionProtectionModel, workbook, worksheetProtectionModel]);


    const [ruleList, setRuleList] = useState<IPermissionPoint[]>([]);

    useEffect(() => {
        const subscription = merge(
            selectionProtectionModel.ruleChange$,
            workbook.activeSheet$
        ).subscribe(async () => {
            const ruleList = await getRuleList(isCurrentSheet);
            setRuleList(ruleList);
        });
        return () => {
            subscription.unsubscribe();
        };
    }, [getRuleList, isCurrentSheet, selectionProtectionModel, workbook]);


    const handleDelete = async (rule: IRuleItem) => {
        const { unitId, subUnitId } = rule;
        const res = await commandService.executeCommand(DeleteRangeSelectionCommand.id, { unitId, subUnitId, rule });
        if (res) {
            setForceUpdateFlag(!forceUpdateFlag);
        }
    };

    const allRuleMap = new Map<string, ISelectionProtectionRule | IWorksheetProtectionRule>();
    workbook.getSheets().forEach((sheet) => {
        const sheetId = sheet.getSheetId();
        const rangeRules = selectionProtectionModel.getSubunitRuleList(unitId, sheetId);
        rangeRules.forEach((rule) => {
            allRuleMap.set(rule.permissionId, rule);
        });

        const sheetRule = worksheetProtectionModel.getRule(unitId, sheetId);
        if (sheetRule) {
            allRuleMap.set(sheetRule?.permissionId, sheetRule);
        }
    });

    const handleEdit = (rule: IPermissionPanelRule) => {
        sheetPermissionPanelModel.setRule(rule);
        sheetPermissionPanelModel.setOldRule(rule);

        const sidebarProps = {
            header: { title: 'permission.panel.title' },
            children: {
                label: UNIVER_SHEET_PERMISSION_PANEL,
                showDetail: true,
            },
            width: 320,
            footer: {
                label: UNIVER_SHEET_PERMISSION_PANEL_FOOTER,
                showDetail: true,
            },
        };

        sidebarService.open(sidebarProps);
    };

    const handleChangeHeaderType = async (isCurrentSheet: boolean) => {
        setIsCurrentSheet(isCurrentSheet);
        const ruleList = await getRuleList(isCurrentSheet);
        setRuleList(ruleList);
    };

    const manageCollaboratorAction = workbookPermissionService.getManageCollaboratorPermission(unitId);


    return (
        <div className={styles.sheetPermissionListPanelWrapper}>
            <div className={styles.sheetPermissionListPanelHeader}>
                <div className={styles.sheetPermissionListPanelHeaderType} onClick={() => handleChangeHeaderType(true)}>
                    <div className={clsx({ [styles.sheetPermissionListPanelHeaderSelect]: isCurrentSheet })}>{localeService.t('permission.panel.currentSheet')}</div>
                    {isCurrentSheet && <div className={styles.sheetPermissionListPanelHeaderTypeBottom} />}
                </div>
                <div className={styles.sheetPermissionListPanelHeaderType} onClick={() => handleChangeHeaderType(false)}>
                    <div className={clsx({ [styles.sheetPermissionListPanelHeaderSelect]: !isCurrentSheet })}>{localeService.t('permission.panel.allSheet')}</div>
                    {!isCurrentSheet && <div className={styles.sheetPermissionListPanelHeaderTypeBottom} />}
                </div>
            </div>

            <div className={styles.sheetPermissionListPanelContent}>
                {ruleList?.map((item) => {
                    const rule = allRuleMap.get(item.objectID);

                    if (!rule) {
                        return null;
                    }

                    const editAction = item.actions.find((action) => action.action === UnitAction.Edit);
                    const editPermission = editAction?.allowed;

                    const viewAction = item.actions.find((action) => action.action === UnitAction.View);
                    const viewPermission = viewAction?.allowed;

                    return (
                        <div key={item.objectID} className={styles.sheetPermissionListItem}>
                            <div className={styles.sheetPermissionListItemHeader}>
                                <Tooltip title={rule.name}>
                                    <div className={styles.sheetPermissionListItemHeaderName}>{rule.name}</div>
                                </Tooltip>
                                {manageCollaboratorAction && (
                                    <div className={styles.sheetPermissionListItemHeaderOperator}>
                                        <Tooltip title={localeService.t('permission.panel.edit')}>
                                            <div onClick={() => handleEdit(rule)}>edit</div>
                                        </Tooltip>
                                        <Tooltip title={localeService.t('permission.panel.delete')}>
                                            <div onClick={() => handleDelete(rule)}>delete</div>
                                        </Tooltip>
                                    </div>
                                )}
                            </div>
                            <div className={styles.sheetPermissionListItemSplit} />
                            <div className={styles.sheetPermissionListItemContent}>
                                <div className={styles.sheetPermissionListItemContentEdit}>
                                    <Avatar src={item.creator?.avatar} style={{ marginRight: 6 }} size={24} />
                                    <span className={styles.sheetPermissionListItemContentTitle}>created</span>
                                    <span className={styles.sheetPermissionListItemContentSub}>{editPermission ? 'i can edit' : 'i can not edit'}</span>

                                </div>
                                <div className={styles.sheetPermissionListItemContentView}>
                                    <span className={styles.sheetPermissionListItemContentTitle}>view permissions</span>
                                    <span className={styles.sheetPermissionListItemContentSub}>{viewPermission ? 'i can view' : 'i can not view'}</span>
                                </div>
                                {rule.description && (
                                    <Tooltip title={rule.description}>
                                        <div className={styles.sheetPermissionListItemContentDesc}>
                                            {rule.description}
                                        </div>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

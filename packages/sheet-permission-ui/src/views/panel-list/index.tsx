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
import type { ICellPermission, ISelectionProtectionRule } from '@univerjs/sheets-selection-protection';
import { ISelectionPermissionIoService, SelectionProtectionRuleModel } from '@univerjs/sheets-selection-protection';
import type { ICellDataForSheetInterceptor, Workbook } from '@univerjs/core';
import { ICommandService, IUniverInstanceService, LocaleService, UniverInstanceType } from '@univerjs/core';
import { ISidebarService } from '@univerjs/ui';
import { merge } from 'rxjs';
import type { IPermissionPoint } from '@univerjs/sheets-selection-protection/service/selection-permission-io/type.js';
import { SheetPermissionPanelService } from '../../service';
import { DeleteSheetPermissionCommand } from '../../command/sheet-permission.command';
import { UNIVER_SHEET_PERMISSION_PANEL, UNIVER_SHEET_PERMISSION_PANEL_FOOTER } from '../../const';
import styles from './index.module.less';

interface IRuleItem extends ISelectionProtectionRule {
    unitId: string;
    subUnitId: string;
}

export const SheetPermissionPanelList = () => {
    const [isCurrentSheet, setIsCurrentSheet] = useState(true);
    const [forceUpdateFlag, setForceUpdateFlag] = useState(false);
    const sheetPermissionPanelService = useDependency(SheetPermissionPanelService);
    const localeService = useDependency(LocaleService);
    const selectionProtectionModel = useDependency(SelectionProtectionRuleModel);
    const univerInstanceService = useDependency(IUniverInstanceService);
    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheet = workbook.getActiveSheet()!;
    const unitId = workbook.getUnitId();
    const subUnitId = worksheet.getSheetId();
    const commandService = useDependency(ICommandService);
    const sidebarService = useDependency(ISidebarService);
    const selectionPermissionIoService = useDependency(ISelectionPermissionIoService);

    const getRuleList = useCallback(async (isCurrentSheet: boolean) => {
        const worksheet = workbook.getActiveSheet()!;
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();

        const allPermissionRule = await selectionPermissionIoService.list(unitId);

        const subUnitPermissionIds = selectionProtectionModel.getSubunitRuleList(unitId, subUnitId).map((item) => item.permissionId);
        const subUnitRuleList = allPermissionRule.filter((item) => subUnitPermissionIds.includes(item.objectID));

        return isCurrentSheet ? subUnitRuleList : allPermissionRule;
    }, [selectionPermissionIoService, selectionProtectionModel, workbook]);


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


    useEffect(() => {
        return () => {
            sheetPermissionPanelService.setShowDetail(true);
        };
    }, []);


    const handleDelete = async (rule: IRuleItem) => {
        const { unitId, subUnitId } = rule;
        const res = await commandService.executeCommand(DeleteSheetPermissionCommand.id, { unitId, subUnitId, rule });
        if (res) {
            setForceUpdateFlag(!forceUpdateFlag);
        }
    };

    const handleEdit = (rule: IRuleItem) => {
        const activeRule = sheetPermissionPanelService.rule;
        const oldRule = {
            ...activeRule,
            name: rule.name,
            description: rule.description,
            ranges: rule.ranges,
            ruleId: rule.id,
            permissionId: rule.permissionId,
        };
        sheetPermissionPanelService.setRule(oldRule);
        sheetPermissionPanelService.setShowDetail(true);
        sheetPermissionPanelService.setOldRule(oldRule);


        sidebarService.open({
            header: { title: 'permission.panel.title' },
            children: { label: UNIVER_SHEET_PERMISSION_PANEL },
            width: 320,
            footer: { label: UNIVER_SHEET_PERMISSION_PANEL_FOOTER },
            onClose: () => {
                sheetPermissionPanelService.setShowDetail(true);
            },
        });
    };

    const handleChangeHeaderType = async (isCurrentSheet: boolean) => {
        setIsCurrentSheet(isCurrentSheet);
        const ruleList = await getRuleList(isCurrentSheet);
        setRuleList(ruleList);
    };

    const allRuleMap = new Map<string, ISelectionProtectionRule>();
    workbook.getSheets().forEach((sheet) => {
        const sheetId = sheet.getSheetId();
        const rules = selectionProtectionModel.getSubunitRuleList(unitId, sheetId);
        rules.forEach((rule) => {
            allRuleMap.set(rule.permissionId, rule);
        });
    });

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

                    let hasEditPermission = true;
                    let hasViewPermission = true;
                    let hasManageCollaboratorPermission = true;

                    const ranges = rule?.ranges || [];

                    for (let i = 0; i < ranges.length; i++) {
                        const range = ranges[i];
                        for (let j = range?.startRow; j <= range?.endRow; j++) {
                            for (let k = range?.startColumn; k <= range?.endColumn; k++) {
                                const permission = (worksheet.getCell(j, k) as (ICellDataForSheetInterceptor & { selectionProtection: ICellPermission[] }))?.selectionProtection?.[0];
                                if (permission.Edit === false) {
                                    hasEditPermission = false;
                                }
                                if (permission.View === false) {
                                    hasViewPermission = false;
                                }
                                if (permission.ManageCollaborator === false) {
                                    hasManageCollaboratorPermission = false;
                                }
                            }
                        }
                    }


                    return (
                        <div key={item.objectID} className={styles.sheetPermissionListItem}>
                            <div className={styles.sheetPermissionListItemHeader}>
                                <Tooltip title={rule.name}>
                                    <div className={styles.sheetPermissionListItemHeaderName}>{rule.name}</div>
                                </Tooltip>
                                {hasManageCollaboratorPermission && (
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
                                    <span className={styles.sheetPermissionListItemContentSub}>{hasEditPermission ? 'i can edit' : 'i can not edit'}</span>

                                </div>
                                <div className={styles.sheetPermissionListItemContentView}>
                                    <span className={styles.sheetPermissionListItemContentTitle}>view permissions</span>
                                    <span className={styles.sheetPermissionListItemContentSub}>{hasViewPermission ? 'i can view' : 'i can not view'}</span>
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

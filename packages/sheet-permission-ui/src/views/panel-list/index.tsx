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
import { ICommandService, IUniverInstanceService, LocaleService, UniverInstanceType } from '@univerjs/core';
import { ISidebarService } from '@univerjs/ui';
import { merge } from 'rxjs';
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
    const selectionProtectionRuleModel = useDependency(SelectionProtectionRuleModel);

    const getRuleList = useCallback((isCurrentSheet: boolean) => {
        const worksheet = workbook.getActiveSheet()!;
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();

        const allPermissionRule = Array.from(workbook.getWorksheets().values()).reduce((acc, sheet) => {
            const subUnitId = sheet.getSheetId();
            const subUnitRuleList = selectionProtectionModel.getSubunitRuleList(unitId, sheet.getSheetId()).map((item) => {
                return {
                    ...item,
                    unitId,
                    subUnitId,
                };
            });
            if (subUnitRuleList.length) {
                acc.push(...subUnitRuleList);
            }
            return acc;
        }, [] as IRuleItem[]);

        const subUnitRuleList = selectionProtectionModel.getSubunitRuleList(unitId, subUnitId).map((item) => {
            return {
                ...item,
                unitId,
                subUnitId,
            };
        });
        return isCurrentSheet ? subUnitRuleList : allPermissionRule;
    }, [selectionProtectionModel, workbook]);


    const [ruleList, setRuleList] = useState(() => getRuleList(isCurrentSheet));

    useEffect(() => {
        const subscription = merge(
            selectionProtectionRuleModel.ruleChange$,
            workbook.activeSheet$
        ).subscribe(() => {
            setRuleList(getRuleList(isCurrentSheet));
        });
        return () => {
            subscription.unsubscribe();
        };
    }, [getRuleList, isCurrentSheet, selectionProtectionRuleModel, workbook]);


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

    const handleChangeHeaderType = (isCurrentSheet: boolean) => {
        setIsCurrentSheet(isCurrentSheet);
        setRuleList(getRuleList(isCurrentSheet));
    };

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
                    return (
                        <div key={item.permissionId} className={styles.sheetPermissionListItem}>
                            <div className={styles.sheetPermissionListItemHeader}>
                                <Tooltip title={item.name}>
                                    <div className={styles.sheetPermissionListItemHeaderName}>{item.name}</div>
                                </Tooltip>
                                <div className={styles.sheetPermissionListItemHeaderOperator}>
                                    <Tooltip title={localeService.t('permission.panel.edit')}>
                                        <div onClick={() => handleEdit(item)}>edit</div>
                                    </Tooltip>
                                    <Tooltip title={localeService.t('permission.panel.delete')}>
                                        <div onClick={() => handleDelete(item)}>delete</div>
                                    </Tooltip>
                                </div>
                            </div>
                            <div className={styles.sheetPermissionListItemSplit} />
                            <div className={styles.sheetPermissionListItemContent}>
                                <div className={styles.sheetPermissionListItemContentEdit}>
                                    <Avatar style={{ marginRight: 6 }} size={24} />
                                    <span className={styles.sheetPermissionListItemContentTitle}>created</span>
                                    <span className={styles.sheetPermissionListItemContentSub}>i can edit</span>

                                </div>
                                <div className={styles.sheetPermissionListItemContentView}>
                                    <span className={styles.sheetPermissionListItemContentTitle}>view permissions</span>
                                    <span className={styles.sheetPermissionListItemContentSub}>i can view</span>
                                </div>
                                {item.description && (
                                    <Tooltip title={item.description}>
                                        <div className={styles.sheetPermissionListItemContentDesc}>
                                            {item.description}
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

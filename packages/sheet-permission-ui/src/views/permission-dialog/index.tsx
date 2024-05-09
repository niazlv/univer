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

import React, { useEffect, useState } from 'react';

import { Button, Switch } from '@univerjs/design';
import clsx from 'clsx';
import { useDependency } from '@wendellhu/redi/react-bindings';
import type { Workbook } from '@univerjs/core';
import { IAuthzIoService, IUniverInstanceService, LocaleService, UniverInstanceType } from '@univerjs/core';
import { IDialogService } from '@univerjs/ui';
import { WorksheetProtectionRuleModel } from '@univerjs/sheets';
import { UnitAction, UnitObject } from '@univerjs/protocol';
import { subUnitPermissionTypeMap, UNIVER_SHEET_PERMISSION_DIALOG_ID } from '../../const';
import styles from './index.module.less';

interface IPermissionMap {
    [key: string]: {
        text: string;
        allowed: boolean;
    };
}


export const SheetPermissionDialog = () => {
    const localeService = useDependency(LocaleService);
    const univerInstanceService = useDependency(IUniverInstanceService);
    const authzIoService = useDependency(IAuthzIoService);
    const worksheetProtectionRuleModel = useDependency(WorksheetProtectionRuleModel);
    const dialogService = useDependency(IDialogService);

    const [permissionMap, setPermissionMap] = useState(() => {
        return Object.keys(subUnitPermissionTypeMap).reduce((acc, action) => {
            acc[action] = {
                text: localeService.t(`permission.panel.${subUnitPermissionTypeMap[action]}`),
                allowed: true,
            };
            return acc;
        }, {} as IPermissionMap);
    });

    useEffect(() => {
        const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
        const worksheet = workbook?.getActiveSheet();
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();
        const rule = worksheetProtectionRuleModel.getRule(unitId, subUnitId);
        if (!rule) {
            return;
        }
        rule.permissionId && authzIoService.allowed({
            objectID: rule.permissionId,
            objectType: UnitObject.Worksheet,
            unitID: unitId,
            actions: [UnitAction.Edit, UnitAction.View],
        }).then((res) => {
            const newPermissionMap = res.reduce((acc, item) => {
                const action = item.action;
                if (action in subUnitPermissionTypeMap) {
                    acc[action] = {
                        text: localeService.t(`permission.panel.${subUnitPermissionTypeMap[action as unknown as UnitAction]}`),
                        allowed: item.allowed,
                    };
                }
                return acc;
            }, {} as IPermissionMap);
            setPermissionMap({
                ...permissionMap,
                ...newPermissionMap,
            });
        });
    }, []);

    return (
        <div className={styles.sheetPermissionDialogWrapper}>
            <div className={styles.sheetPermissionDialogSplit} />
            {Object.keys(permissionMap).map((action) => {
                const actionItem = permissionMap[action];
                const { text, allowed } = actionItem;
                return (
                    <div key={text} className={styles.sheetPermissionDialogItem}>
                        <div>{text}</div>
                        <Switch
                            defaultChecked={allowed}
                            onChange={() => {
                                setPermissionMap({
                                    ...permissionMap,
                                    [action]: {
                                        ...actionItem,
                                        allowed: !allowed,
                                    },
                                });
                            }}
                        />
                    </div>
                );
            })}
            <div className={styles.sheetPermissionDialogSplit}></div>
            <div className={styles.sheetPermissionUserDialogFooter}>

                <Button
                    className={styles.sheetPermissionUserDialogButton}
                    onClick={() => {
                        dialogService.close(UNIVER_SHEET_PERMISSION_DIALOG_ID);
                    }}
                >
                    {localeService.t('permission.button.cancel')}
                </Button>
                <Button
                    type="primary"
                    onClick={() => {
                        // 生成新的permissionId 然后setRuleCommand
                        dialogService.close(UNIVER_SHEET_PERMISSION_DIALOG_ID);
                    }}
                    className={clsx(styles.sheetPermissionUserDialogFooterConfirm, styles.sheetPermissionUserDialogButton)}
                >
                    {localeService.t('permission.button.confirm')}
                </Button>
            </div>
        </div>
    );
};

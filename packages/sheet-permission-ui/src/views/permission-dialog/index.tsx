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
import { IUniverInstanceService, LocaleService, UniverInstanceType } from '@univerjs/core';
import { SelectionProtectionRuleModel } from '@univerjs/sheets-selection-protection';
import { IDialogService } from '@univerjs/ui';
import { UNIVER_SHEET_PERMISSION_DIALOG_ID } from '../../const';
import styles from './index.module.less';


export const SheetPermissionDialog = () => {
    const [permissionTypeList, setPermissionTypeList] = useState<string[]>([]);
    const localeService = useDependency(LocaleService);
    const univerInstanceService = useDependency(IUniverInstanceService);
    const selectionProtectionRuleModel = useDependency(SelectionProtectionRuleModel);
    const dialogService = useDependency(IDialogService);

    const permissionList = [
        `${localeService.t('permission.dialog.setCellValue')}`,
        `${localeService.t('permission.dialog.setCellStyle')}`,
        `${localeService.t('permission.dialog.copy')}`,
    ];

    useEffect(() => {
        const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
        const worksheet = workbook?.getActiveSheet();
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();
        const ruleList = selectionProtectionRuleModel.getSubunitRuleList(unitId, subUnitId);
        if (ruleList.length) {
            // const firstRule = ruleList[0];
            // console.log('debugger', ruleList);
        }
    }, []);

    return (
        <div className={styles.sheetPermissionDialogWrapper}>
            <div className={styles.sheetPermissionDialogSplit} />
            {permissionList.map((item) => {
                const defaultChecked = permissionTypeList.includes(item);
                return (
                    <div key={item} className={styles.sheetPermissionDialogItem}>
                        <div>{item}</div>
                        <Switch onChange={() => {
                            if (defaultChecked) {
                                setPermissionTypeList(permissionTypeList.filter((i) => i !== item));
                            } else {
                                setPermissionTypeList([...permissionTypeList, item]);
                            }
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

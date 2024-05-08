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

import React, { useState } from 'react';

import { Button, Switch } from '@univerjs/design';
import clsx from 'clsx';
import { useDependency } from '@wendellhu/redi/react-bindings';
import type { Workbook } from '@univerjs/core';
import { IUniverInstanceService, LocaleService, UniverInstanceType } from '@univerjs/core';
import { IDialogService } from '@univerjs/ui';
import type { GetWorksheetPermission } from '@univerjs/sheets';
import { WorksheetPermissionService } from '@univerjs/sheets';
import { sheetPermissionList, UNIVER_SHEET_PERMISSION_DIALOG_ID } from '../../const';
import styles from './index.module.less';


export const SheetPermissionDialog = () => {
    const localeService = useDependency(LocaleService);
    const univerInstanceService = useDependency(IUniverInstanceService);
    const worksheetPermissionService = useDependency(WorksheetPermissionService);
    const dialogService = useDependency(IDialogService);

    const [permissionMap, setPermissionMap] = useState(() => {
        const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
        const worksheet = workbook?.getActiveSheet();
        const unitId = workbook.getUnitId();
        const subUnitId = worksheet.getSheetId();
        const permissionMap: Record<string, boolean> = {};
        sheetPermissionList.forEach((item) => {
            const permissionName = `get${item}Permission` as keyof WorksheetPermissionService;
            const fn = worksheetPermissionService[permissionName] as GetWorksheetPermission;
            const permissionValue = fn?.({ unitId, subUnitId }) ?? false;
            permissionMap[item] = permissionValue;
        });


        return permissionMap;
    });

    return (
        <div className={styles.sheetPermissionDialogWrapper}>
            <div className={styles.sheetPermissionDialogSplit} />
            {Object.keys(permissionMap).map((name) => {
                const checked = permissionMap[name];
                return (
                    <div key={name} className={styles.sheetPermissionDialogItem}>
                        <div>{name}</div>
                        <Switch
                            defaultChecked={checked}
                            onChange={() => {
                                setPermissionMap({
                                    ...permissionMap,
                                    [name]: !checked,
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
                        // change action permissionMap
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

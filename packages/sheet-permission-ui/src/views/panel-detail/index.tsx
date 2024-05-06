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

import React, { useEffect } from 'react';
import { Avatar, FormLayout, Input, Radio, RadioGroup, Select } from '@univerjs/design';
import { useDependency } from '@wendellhu/redi/react-bindings';
import type { Workbook } from '@univerjs/core';
import { createInternalEditorID, isValidRange, IUniverInstanceService, LocaleService, UniverInstanceType, UserManagerService } from '@univerjs/core';
import { IDialogService, RangeSelector, useObservable } from '@univerjs/ui';
import { SelectionManagerService } from '@univerjs/sheets';
import { serializeRange } from '@univerjs/engine-formula';
import type { ICollaborator } from '@univerjs/sheets-selection-protection';
import { ISelectionPermissionIoService, UnitRole } from '@univerjs/sheets-selection-protection';
import { UnitObject } from '@univerjs/sheets-selection-protection/model/type.js';
import { SheetPermissionPanelService, SheetPermissionUserManagerService } from '../../service';
import { UNIVER_SHEET_PERMISSION_USER_DIALOG, UNIVER_SHEET_PERMISSION_USER_DIALOG_ID } from '../../const';
import { viewState } from '../../service/sheet-permission-side-panel.service';
import styles from './index.module.less';

export const SheetPermissionPanelDetail = () => {
    const localeService = useDependency(LocaleService);
    const dialogService = useDependency(IDialogService);
    const univerInstanceService = useDependency(IUniverInstanceService);
    const selectionManagerService = useDependency(SelectionManagerService);
    const sheetPermissionPanelService = useDependency(SheetPermissionPanelService);
    const activeRule = useObservable(sheetPermissionPanelService.rule$, sheetPermissionPanelService.rule);
    const userManagerService = useDependency(UserManagerService);
    const sheetPermissionUserManagerService = useDependency(SheetPermissionUserManagerService);
    const selectionPermissionIoService = useDependency(ISelectionPermissionIoService);


    const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
    const worksheet = workbook.getActiveSheet()!;
    const unitId = workbook.getUnitId();
    const subUnitId = worksheet.getSheetId();


    const selectUserList = useObservable(sheetPermissionUserManagerService.selectUserList$, sheetPermissionUserManagerService.selectUserList);

    const [editorGroupValue, setEditorGroupValue] = React.useState(selectUserList.length ? 'designedUserCanEdit' : 'onlyMe');
    const [viewGroupValue, setViewGroupValue] = React.useState(viewState.othersCanView);

    const handleAddPerson = async () => {
        const userList = await selectionPermissionIoService.listCollaborators({
            permissionId: unitId, //@ybzky todo 要先取worksheet的permissionId，没有的话再去取workbook的permissionId
            unitId,
        });
        userList.forEach((user) => {
            if (user?.subject) {
                userManagerService.addUser(user.subject);
            }
        });

        sheetPermissionUserManagerService.setUserList(userList);

        dialogService.open({
            id: UNIVER_SHEET_PERMISSION_USER_DIALOG_ID,
            title: { title: '' },
            children: { label: UNIVER_SHEET_PERMISSION_USER_DIALOG },
            width: 280,
            destroyOnClose: true,
            onClose: () => dialogService.close(UNIVER_SHEET_PERMISSION_USER_DIALOG_ID),
            className: 'sheet-permission-user-dialog',
        });
    };


    useEffect(() => {
        const isEdit = activeRule?.permissionId;
        if (isEdit) return;
        const isFromSheetBar = sheetPermissionPanelService.isFromSheetBar;
        if (isFromSheetBar) {
            selectionManagerService.clear();
            selectionManagerService.add([
                {
                    primary: null,
                    style: null,
                    range: {
                        startRow: 0,
                        startColumn: 0,
                        endRow: worksheet.getRowCount() - 1,
                        endColumn: worksheet.getColumnCount() - 1,
                    },
                },
            ]);
        }
        const ranges = selectionManagerService.getSelectionRanges() ?? [];
        const rangeStr = ranges?.length
            ? ranges.map((range) => {
                const v = serializeRange(range);
                return v === 'NaN' ? '' : v;
            }).filter((r) => !!r).join(',')
            : '';
        const sheetName = worksheet.getName();
        sheetPermissionPanelService.setRule({
            ranges,
            name: isFromSheetBar ? `${sheetName}` : `${sheetName}(${rangeStr})`,
            unitId,
            subUnitId,

        });
    }, []);

    useEffect(() => {
        const getSelectUserList = async () => {
            const permissionId = activeRule?.permissionId;
            const collaborators = await selectionPermissionIoService.listCollaborators({
                permissionId,
                unitId,
            });
            const selectUserList: ICollaborator[] = collaborators.filter((user) => {
                return user.role === UnitRole.Editor;
            });
            sheetPermissionUserManagerService.setSelectUserList(selectUserList);
            if (selectUserList?.length > 0) {
                setEditorGroupValue('designedUserCanEdit');
            }
            const viewGroupValue = collaborators.find((user) => {
                return user.role === UnitRole.UNRECOGNIZED;
            });

            if (viewGroupValue) {
                setViewGroupValue(viewState.noOneElseCanView);
            }
        };
        if (activeRule?.permissionId) {
            getSelectUserList();
        }
    }, []);

    useEffect(() => {
        sheetPermissionPanelService.setRule({
            viewStatus: viewGroupValue,
        });
    }, [sheetPermissionPanelService, viewGroupValue]);

    return (
        <div className={styles.permissionPanelDetailWrapper}>
            <FormLayout label={localeService.t('permission.panel.name')}>
                <Input
                    value={activeRule?.name ?? ''}
                    onChange={(v) => sheetPermissionPanelService.setRule({ name: v })}
                />
            </FormLayout>
            <FormLayout label={localeService.t('permission.panel.protectedRange')}>
                <RangeSelector
                    value={activeRule?.ranges?.map((i) => serializeRange(i)).join(',')}
                    id={createInternalEditorID('sheet-permission-panel')}
                    openForSheetUnitId={unitId}
                    openForSheetSubUnitId={subUnitId}
                    onChange={(newRange) => {
                        if (newRange.some((i) => !isValidRange(i.range) || i.range.endColumn < i.range.startColumn || i.range.endRow < i.range.startRow)) {
                            return;
                        }

                        const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
                        const worksheet = workbook.getActiveSheet()!;
                        const unitId = workbook.getUnitId();
                        const subUnitId = worksheet.getSheetId();
                        const rule = {
                            ranges: newRange.map((i) => i.range),
                            unitId,
                            subUnitId,
                            unitType: UnitObject.SelectRange,
                        };
                        const ruleRangeHasWholeSheet = rule.ranges.some((range) => {
                            return range.startRow === 0 && range.startColumn === 0 && range.endRow === worksheet.getRowCount() - 1 && range.endColumn === worksheet.getColumnCount() - 1;
                        });
                        if (ruleRangeHasWholeSheet) {
                            rule.ranges = [];
                            rule.unitType = UnitObject.Worksheet;
                        }
                        sheetPermissionPanelService.setRule(rule);
                    }}

                />
            </FormLayout>
            <FormLayout label={localeService.t('permission.panel.permissionDirection')}>
                <Input
                    value={activeRule?.description ?? ''}
                    onChange={(v) => sheetPermissionPanelService.setRule({ description: v })}
                    placeholder={localeService.t('permission.panel.permissionDirectionPlaceholder')}
                />
            </FormLayout>
            <FormLayout label={localeService.t('permission.panel.editPermission')}>
                <RadioGroup
                    value={editorGroupValue}
                    onChange={(v) => {
                        setEditorGroupValue(v as string);
                        if (v === 'onlyMe') {
                            sheetPermissionUserManagerService.setSelectUserList([]);
                        }
                    }}
                    className={styles.radioGroupVertical}
                >
                    <Radio value="onlyMe">
                        <span className={styles.text}>{localeService.t('permission.panel.onlyICanEdit')}</span>
                    </Radio>
                    <Radio value="designedUserCanEdit">
                        <span className={styles.text}>{localeService.t('permission.panel.designedUserCanEdit')}</span>
                    </Radio>
                </RadioGroup>
            </FormLayout>
            {editorGroupValue === 'designedUserCanEdit' && (
                <div className={styles.sheetPermissionDesignPersonPanel}>
                    <div className={styles.sheetPermissionDesignPersonPanelHeader}>
                        <span>{localeService.t('permission.panel.designedPerson')}</span>
                        <span className={styles.sheetPermissionDesignPersonPanelHeaderAdd} onClick={handleAddPerson}>{localeService.t('permission.panel.addPerson')}</span>
                    </div>
                    <div className={styles.sheetPermissionDesignPersonPanelSplit}></div>
                    <div className={styles.sheetPermissionDesignPersonPanelContent}>
                        {selectUserList?.length > 0
                            ? selectUserList.map((item) => {
                                return (
                                    <div key={item.subject?.userID} className={styles.sheetPermissionDesignPersonPanelContentItem}>
                                        <Avatar size={24} src={item.subject?.avatar} />
                                        <span className={styles.sheetPermissionDesignPersonPanelContentItemName}>{item.subject?.name}</span>
                                        <Select
                                            className={styles.sheetPermissionDesignPersonPanelContentItemSelect}
                                            value={item.role === UnitRole.Editor ? 'edit' : 'view'}
                                            onChange={(v) => {
                                                if (v === 'delete') {
                                                    sheetPermissionUserManagerService.setSelectUserList(selectUserList.filter((i) => i.subject?.userID !== item.subject?.userID));
                                                } else {
                                                    const index = selectUserList.findIndex((i) => i.subject?.userID === item.subject?.userID);
                                                    if (index !== -1) {
                                                        const newSelectUserList = selectUserList.map((userItem) => {
                                                            if (userItem.subject?.userID !== item.subject?.userID) {
                                                                return userItem;
                                                            } else {
                                                                return {
                                                                    ...userItem,
                                                                    role: v === 'edit' ? UnitRole.Editor : UnitRole.Reader,
                                                                };
                                                            }
                                                        });
                                                        sheetPermissionUserManagerService.setSelectUserList(newSelectUserList);
                                                    }
                                                }
                                            }}
                                            options={[
                                                { label: `${localeService.t('permission.panel.canEdit')}`, value: 'edit' },
                                                { label: `${localeService.t('permission.panel.canView')}`, value: 'view' },
                                                { label: `${localeService.t('permission.panel.delete')}`, value: 'delete' },
                                            ]}
                                        />
                                    </div>
                                );
                            })
                            : (<div>empty</div>)}
                    </div>
                </div>
            )}
            <FormLayout label={localeService.t('permission.panel.viewPermission')}>
                <RadioGroup
                    value={viewGroupValue}
                    onChange={(v) => setViewGroupValue(v as viewState)}
                    className={styles.radioGroupVertical}
                >
                    <Radio value={viewState.othersCanView}>
                        <span className={styles.text}>{localeService.t('permission.panel.othersCanView')}</span>
                    </Radio>
                    <Radio value={viewState.noOneElseCanView}>
                        <span className={styles.text}>{localeService.t('permission.panel.noOneElseCanView')}</span>
                    </Radio>
                </RadioGroup>
            </FormLayout>
        </div>
    );
};

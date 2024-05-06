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
import { ISidebarService } from '@univerjs/ui';
import { LocaleService } from '@univerjs/core';
import { SheetPermissionPanelService } from '../../service';
import { UNIVER_SHEET_PERMISSION_PANEL, UNIVER_SHEET_PERMISSION_PANEL_FOOTER } from '../../const';
import styles from './index.module.less';

export const SheetPermissionPanelAddFooter = () => {
    const sheetPermissionPanelService = useDependency(SheetPermissionPanelService);
    const sidebarService = useDependency(ISidebarService);
    const localeService = useDependency(LocaleService);
    return (
        <div>
            <Button
                className={styles.sheetPermissionPanelAddButton}
                type="primary"
                onClick={() => {
                    sheetPermissionPanelService.setShowDetail(true);
                    sidebarService.open({
                        header: { title: '保护行列' },
                        children: { label: UNIVER_SHEET_PERMISSION_PANEL },
                        width: 320,
                        footer: { label: UNIVER_SHEET_PERMISSION_PANEL_FOOTER },
                    });
                }}
            >
                <div>+ </div>
                {localeService.t('permission.button.addNewPermission')}
            </Button>
        </div>
    );
};

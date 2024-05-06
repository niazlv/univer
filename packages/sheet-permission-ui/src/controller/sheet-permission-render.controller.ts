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


import { LifecycleStages, OnLifecycle, RxDisposable } from '@univerjs/core';
import type { IMenuItemFactory } from '@univerjs/ui';
import { ComponentManager, IMenuService } from '@univerjs/ui';
import { Inject, Injector } from '@wendellhu/redi';
import { UNIVER_SHEET_PERMISSION_ALERT_DIALOG, UNIVER_SHEET_PERMISSION_DIALOG, UNIVER_SHEET_PERMISSION_PANEL, UNIVER_SHEET_PERMISSION_PANEL_ADD_FOOTER, UNIVER_SHEET_PERMISSION_PANEL_FOOTER, UNIVER_SHEET_PERMISSION_PANEL_LIST, UNIVER_SHEET_PERMISSION_USER_DIALOG } from '../const';
import { SheetPermissionDialog, SheetPermissionPanel, SheetPermissionPanelAddFooter, SheetPermissionPanelFooter, SheetPermissionPanelList, SheetPermissionUserDialog } from '../views';
import { AlertDialog } from '../views/alert-dialog';
import {
    sheetPermissionAddProtectContextMenuFactory,
    sheetPermissionChangeSheetPermissionSheetBarMenuFactory,
    sheetPermissionContextMenuFactory,
    sheetPermissionEditProtectContextMenuFactory,
    sheetPermissionProtectSheetInSheetBarMenuFactory,
    sheetPermissionRemoveProtectContextMenuFactory,
    sheetPermissionRemoveProtectionSheetBarMenuFactory,
    sheetPermissionToolbarMenuFactory,
    sheetPermissionViewAllProtectRuleContextMenuFactory,
    sheetPermissionViewAllProtectRuleSheetBarMenuFactory,

} from './sheet-permission-menu';

@OnLifecycle(LifecycleStages.Rendered, SheetPermissionRenderController)
export class SheetPermissionRenderController extends RxDisposable {
    constructor(
        @IMenuService private _menuService: IMenuService,
        @Inject(ComponentManager) private _componentManager: ComponentManager,
        @Inject(Injector) private readonly _injector: Injector
    ) {
        super();
        this._init();
    }

    private _init() {
        this._initToolbarMenu();
        this._initContextMenu();
        this._initComponents();
    }

    private _initToolbarMenu() {
        [
            sheetPermissionToolbarMenuFactory,
        ].forEach((menu) => {
            this.disposeWithMe(this._menuService.addMenuItem(this._injector.invoke(menu)));
        });
    }

    private _initContextMenu() {
        ([
            sheetPermissionContextMenuFactory,
            sheetPermissionAddProtectContextMenuFactory,
            sheetPermissionEditProtectContextMenuFactory,
            sheetPermissionRemoveProtectContextMenuFactory,
            sheetPermissionViewAllProtectRuleContextMenuFactory,
            sheetPermissionProtectSheetInSheetBarMenuFactory,
            sheetPermissionRemoveProtectionSheetBarMenuFactory,
            sheetPermissionChangeSheetPermissionSheetBarMenuFactory,
            sheetPermissionViewAllProtectRuleSheetBarMenuFactory,
        ] as IMenuItemFactory[]).forEach((factory) => {
            this.disposeWithMe(this._menuService.addMenuItem(this._injector.invoke(factory)));
        });
    }

    private _initComponents() {
        ([
            [
                UNIVER_SHEET_PERMISSION_PANEL,
                SheetPermissionPanel,
            ],
            [
                UNIVER_SHEET_PERMISSION_PANEL_FOOTER,
                SheetPermissionPanelFooter,
            ],
            [
                UNIVER_SHEET_PERMISSION_PANEL_LIST,
                SheetPermissionPanelList,
            ],
            [
                UNIVER_SHEET_PERMISSION_PANEL_ADD_FOOTER,
                SheetPermissionPanelAddFooter,
            ],
            [
                UNIVER_SHEET_PERMISSION_USER_DIALOG,
                SheetPermissionUserDialog,
            ],
            [
                UNIVER_SHEET_PERMISSION_DIALOG,
                SheetPermissionDialog,
            ],
            [
                UNIVER_SHEET_PERMISSION_ALERT_DIALOG,
                AlertDialog,
            ],
        ] as const).forEach(([key, component]) => {
            this.disposeWithMe(this._componentManager.register(
                key,
                component
            ));
        });
    }
}

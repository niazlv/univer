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

import type { IMenuButtonItem, IMenuItem, IMenuSelectorItem } from '@univerjs/ui';
import { MenuGroup, MenuItemType, MenuPosition } from '@univerjs/ui';
import type { IAccessor } from '@wendellhu/redi';
import { combineLatestWith, map } from 'rxjs';
import { SheetPermissionOpenPanelOperation } from '../operation/sheet-permission-open-panel.operation';
import { AddSheetPermissionFromContextMenuCommand, AddSheetPermissionFromSheetBarCommand, ChangeSheetPermissionFromSheetBarCommand, deleteSheetPermissionFromContextMenuCommand, SetSheetPermissionFromContextMenuCommand, ViewSheetPermissionFromContextMenuCommand, ViewSheetPermissionFromSheetBarCommand } from '../command/sheet-permission.command';
import { getAddPermissionDisable$, getAddPermissionHidden$, getEditPermissionHiddenOrDelete$, getPermissionDisableBase$ } from './utils';

export const tmpIcon = 'data-validation-single';
const SHEET_PERMISSION_MENU_ID = 'sheet.menu.permission';
const SHEET_PERMISSION_CONTEXT_MENU_ID = 'sheet.contextMenu.permission';

enum SheetMenuPosition {
    ROW_HEADER_CONTEXT_MENU = 'rowHeaderContextMenu',
    COL_HEADER_CONTEXT_MENU = 'colHeaderContextMenu',
    SHEET_BAR = 'sheetBar',
}


export function sheetPermissionToolbarMenuFactory(accessor: IAccessor): IMenuItem {
    return {
        id: SheetPermissionOpenPanelOperation.id,
        type: MenuItemType.BUTTON,
        positions: [
            MenuPosition.TOOLBAR_START,
        ],
        group: MenuGroup.TOOLBAR_OTHERS,
        icon: tmpIcon,
        tooltip: 'permission.toolbarMenu',
        disabled$: getAddPermissionDisable$(accessor),
    };
}

export function sheetPermissionContextMenuFactory(): IMenuSelectorItem<string> {
    return {
        id: SHEET_PERMISSION_CONTEXT_MENU_ID,
        group: MenuGroup.CONTEXT_MENU_LAYOUT,
        type: MenuItemType.SUBITEMS,
        title: 'rightClick.protectRange',
        icon: tmpIcon,
        positions: [MenuPosition.CONTEXT_MENU, SheetMenuPosition.ROW_HEADER_CONTEXT_MENU, SheetMenuPosition.COL_HEADER_CONTEXT_MENU],
    };
}

export function sheetPermissionAddProtectContextMenuFactory(accessor: IAccessor): IMenuButtonItem {
    return {
        id: AddSheetPermissionFromContextMenuCommand.id,
        type: MenuItemType.BUTTON,
        title: 'rightClick.turnOnProtectRange',
        icon: tmpIcon,
        positions: [SHEET_PERMISSION_CONTEXT_MENU_ID],
        hidden$: getAddPermissionHidden$(accessor),
        disabled$: getPermissionDisableBase$(accessor),
    };
}

export function sheetPermissionEditProtectContextMenuFactory(accessor: IAccessor): IMenuButtonItem {
    return {
        id: SetSheetPermissionFromContextMenuCommand.id,
        type: MenuItemType.BUTTON,
        title: 'rightClick.editProtectRange',
        icon: tmpIcon,
        positions: [SHEET_PERMISSION_CONTEXT_MENU_ID],
        hidden$: getEditPermissionHiddenOrDelete$(accessor),
        disabled$: getPermissionDisableBase$(accessor),
    };
}

export function sheetPermissionRemoveProtectContextMenuFactory(accessor: IAccessor): IMenuButtonItem {
    const baseDisable$ = getPermissionDisableBase$(accessor);
    return {
        id: deleteSheetPermissionFromContextMenuCommand.id,
        type: MenuItemType.BUTTON,
        title: 'rightClick.removeProtectRange',
        icon: tmpIcon,
        positions: [SHEET_PERMISSION_CONTEXT_MENU_ID],
        disabled$: baseDisable$.pipe(
            combineLatestWith(getEditPermissionHiddenOrDelete$(accessor)),
            map((([d1, d2]) => d1 || d2))
        ),
    };
}

export function sheetPermissionViewAllProtectRuleContextMenuFactory(): IMenuButtonItem {
    return {
        id: ViewSheetPermissionFromContextMenuCommand.id,
        type: MenuItemType.BUTTON,
        title: 'rightClick.viewAllProtectArea',
        icon: tmpIcon,
        positions: [SHEET_PERMISSION_CONTEXT_MENU_ID],
    };
}

export function sheetPermissionProtectSheetInSheetBarMenuFactory(): IMenuButtonItem {
    return {
        id: AddSheetPermissionFromSheetBarCommand.id,
        type: MenuItemType.BUTTON,
        positions: [SheetMenuPosition.SHEET_BAR],
        title: 'sheetConfig.addProtectSheet',
    };
}

export function sheetPermissionRemoveProtectionSheetBarMenuFactory(): IMenuButtonItem {
    return {
        id: 'tmp 2 ',
        type: MenuItemType.BUTTON,
        positions: [SheetMenuPosition.SHEET_BAR],
        title: 'sheetConfig.removeProtectSheet',
    };
}

export function sheetPermissionChangeSheetPermissionSheetBarMenuFactory(): IMenuButtonItem {
    return {
        id: ChangeSheetPermissionFromSheetBarCommand.id,
        type: MenuItemType.BUTTON,
        positions: [SheetMenuPosition.SHEET_BAR],
        title: 'sheetConfig.changeSheetPermission',
    };
}

export function sheetPermissionViewAllProtectRuleSheetBarMenuFactory(): IMenuButtonItem {
    return {
        id: ViewSheetPermissionFromSheetBarCommand.id,
        type: MenuItemType.BUTTON,
        positions: [SheetMenuPosition.SHEET_BAR],
        title: 'sheetConfig.viewAllProtectArea',
    };
}

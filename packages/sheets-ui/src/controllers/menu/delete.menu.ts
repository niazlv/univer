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

import type { IMenuButtonItem, IMenuSelectorItem } from '@univerjs/ui';
import { MenuGroup, MenuItemType, MenuPosition } from '@univerjs/ui';

import type { IAccessor } from '@wendellhu/redi';
import { DeleteRangeMoveLeftConfirmCommand } from '../../commands/commands/delete-range-move-left-confirm.command ';
import { DeleteRangeMoveUpConfirmCommand } from '../../commands/commands/delete-range-move-up-confirm.command';
import {
    RemoveColConfirmCommand,
    RemoveRowConfirmCommand,
} from '../../commands/commands/remove-row-col-confirm.command';
import { SheetMenuPosition } from './menu';
import { getBaseRangeMenuHidden$, getCellMenuHidden$, getCurrentRangeDisable$, getDeleteMenuHidden$ } from './menu-util';

const DELETE_RANGE_MENU_ID = 'sheet.menu.delete';
export function DeleteRangeMenuItemFactory(accessor: IAccessor): IMenuSelectorItem<string> {
    return {
        id: DELETE_RANGE_MENU_ID,
        group: MenuGroup.CONTEXT_MENU_LAYOUT,
        type: MenuItemType.SUBITEMS,
        title: 'rightClick.delete',
        icon: 'Reduce',
        positions: [MenuPosition.CONTEXT_MENU],
        hidden$: getBaseRangeMenuHidden$(accessor),
    };
}

export function RemoveColMenuItemFactory(accessor: IAccessor): IMenuButtonItem {
    return {
        id: RemoveColConfirmCommand.id,
        group: MenuGroup.CONTEXT_MENU_LAYOUT,
        type: MenuItemType.BUTTON,
        icon: 'DeleteColumn',
        positions: [DELETE_RANGE_MENU_ID, SheetMenuPosition.COL_HEADER_CONTEXT_MENU],
        title: 'rightClick.deleteSelectedColumn',
        disabled$: getCurrentRangeDisable$(accessor),
        hidden$: getDeleteMenuHidden$(accessor, 'col'),
    };
}

export function RemoveRowMenuItemFactory(accessor: IAccessor): IMenuButtonItem {
    return {
        id: RemoveRowConfirmCommand.id,
        group: MenuGroup.CONTEXT_MENU_LAYOUT,
        type: MenuItemType.BUTTON,
        icon: 'DeleteRow',
        positions: [DELETE_RANGE_MENU_ID, SheetMenuPosition.ROW_HEADER_CONTEXT_MENU],
        title: 'rightClick.deleteSelectedRow',
        disabled$: getCurrentRangeDisable$(accessor),
        hidden$: getDeleteMenuHidden$(accessor, 'row'),
    };
}

export function DeleteRangeMoveLeftMenuItemFactory(accessor: IAccessor): IMenuButtonItem {
    return {
        id: DeleteRangeMoveLeftConfirmCommand.id,
        group: MenuGroup.CONTEXT_MENU_LAYOUT,
        type: MenuItemType.BUTTON,
        title: 'rightClick.moveLeft',
        icon: 'DeleteCellShiftLeft',
        positions: [DELETE_RANGE_MENU_ID],
        disabled$: getCurrentRangeDisable$(accessor),
        hidden$: getCellMenuHidden$(accessor, 'col'),
    };
}

export function DeleteRangeMoveUpMenuItemFactory(accessor: IAccessor): IMenuButtonItem {
    return {
        id: DeleteRangeMoveUpConfirmCommand.id,
        group: MenuGroup.CONTEXT_MENU_LAYOUT,
        type: MenuItemType.BUTTON,
        title: 'rightClick.moveUp',
        icon: 'DeleteCellShiftUp',
        positions: [DELETE_RANGE_MENU_ID],
        disabled$: getCurrentRangeDisable$(accessor),
        hidden$: getCellMenuHidden$(accessor, 'row'),
    };
}

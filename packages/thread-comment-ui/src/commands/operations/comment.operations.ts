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

import type { ICommand } from '@univerjs/core';
import { CommandType } from '@univerjs/core';
import { ISidebarService } from '@univerjs/ui';
import type { IAccessor } from '@wendellhu/redi';
import { ThreadCommentPanelService } from '../../services/thread-comment-panel.service';
import { THREAD_COMMENT_PANEL } from '../../types/const';

export const ToggleSheetCommentPanelOperation: ICommand = {
    id: 'thread-comment-ui.operation.toggle-panel',
    type: CommandType.OPERATION,
    handler(accessor: IAccessor) {
        const sidebarService = accessor.get(ISidebarService);
        const panelService = accessor.get(ThreadCommentPanelService);

        if (panelService.panelVisible) {
            sidebarService.close();
            panelService.setPanelVisible(false);
        } else {
            sidebarService.open({
                header: { title: 'threadComment.panel.title' },
                children: { label: THREAD_COMMENT_PANEL },
                width: 312,
            });
            panelService.setPanelVisible(true);
        }

        return true;
    },
};

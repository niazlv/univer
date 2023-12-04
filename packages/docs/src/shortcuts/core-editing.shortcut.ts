import { FOCUSING_DOC } from '@univerjs/core';
import type { IShortcutItem } from '@univerjs/ui';
import { KeyCode } from '@univerjs/ui';

import { BreakLineCommand, DeleteLeftCommand, DeleteRightCommand } from '../commands/commands/core-editing.command';

export const BreakLineShortcut: IShortcutItem = {
    id: BreakLineCommand.id,
    preconditions: (contextService) => contextService.getContextValue(FOCUSING_DOC),
    binding: KeyCode.ENTER,
};

export const DeleteLeftShortcut: IShortcutItem = {
    id: DeleteLeftCommand.id,
    preconditions: (contextService) => contextService.getContextValue(FOCUSING_DOC),
    binding: KeyCode.BACKSPACE,
};

export const DeleteRightShortcut: IShortcutItem = {
    id: DeleteRightCommand.id,
    preconditions: (contextService) => contextService.getContextValue(FOCUSING_DOC),
    binding: KeyCode.DELETE,
};
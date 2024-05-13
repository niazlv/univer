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

export type { Dependency } from '@wendellhu/redi';
export { Inject, Injector } from '@wendellhu/redi';
export { ICommandService, Plugin, UniverInstanceType } from '@univerjs/core';
export { UniverThreadCommentUIPlugin } from '@univerjs/thread-comment-ui';
export { SheetsThreadCommentController } from './controllers/sheets-thread-comment.controller';
export { SheetsThreadCommentRefRangeController } from './controllers/sheets-thread-comment-ref-range.controller';
export { SheetsThreadCommentModel } from './models/sheets-thread-comment.model';
export { SheetsThreadCommentPopupService } from './services/sheets-thread-comment-popup.service';
export { SHEETS_THREAD_COMMENT, UniverSheetsThreadCommentPlugin } from './plugin';

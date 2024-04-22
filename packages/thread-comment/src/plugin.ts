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

import { ICommandService, Plugin, UniverInstanceType } from '@univerjs/core';
import { type Dependency, Inject, Injector } from '@wendellhu/redi';
import { ThreadCommentModel } from './models/thread-comment.model';
import { ThreadCommentResourceController } from './controllers/tc-resource.controller';
import { TC_PLUGIN_NAME } from './types/const';
import { AddCommentMutation, DeleteCommentMutation, ResolveCommentMutation, UpdateCommentMutation } from './commands/mutations/comment.mutation';

export class ThreadCommentPlugin extends Plugin {
    static override pluginName = TC_PLUGIN_NAME;
    static override type = UniverInstanceType.UNIVER;

    constructor(
        _config: unknown,
        @Inject(Injector) protected _injector: Injector,
        @ICommandService private _commandService: ICommandService
    ) {
        super();
    }

    override onStarting(injector: Injector): void {
        ([
            [ThreadCommentModel],
            [ThreadCommentResourceController],
            [ThreadCommentResourceController],
        ] as Dependency[]).forEach(
            (d) => {
                injector.add(d);
            }
        );

        [
            AddCommentMutation,
            UpdateCommentMutation,
            DeleteCommentMutation,
            ResolveCommentMutation,
        ].forEach((command) => {
            this._commandService.registerCommand(command);
        });
    }
}

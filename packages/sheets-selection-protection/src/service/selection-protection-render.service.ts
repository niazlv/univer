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

import { Inject } from '@wendellhu/redi';
import { IRenderManagerService } from '@univerjs/engine-render';
import type { Spreadsheet } from '@univerjs/engine-render';
import { Disposable, IUniverInstanceService, LifecycleStages, OnLifecycle, UniverInstanceType } from '@univerjs/core';
import { selectionProtectionKey, SelectionProtectionRenderExtension } from '../render/selection-protection.render';
import { SelectionProtectionRuleModel } from '../model/selection-protection-rule.model';

@OnLifecycle(LifecycleStages.Ready, SelectionProtectionRenderService)
export class SelectionProtectionRenderService extends Disposable {
    private _selectionProtectionRenderExtension = new SelectionProtectionRenderExtension();
    constructor(
        @Inject(IRenderManagerService) private _renderManagerService: IRenderManagerService,
        @Inject(IUniverInstanceService) private _univerInstanceService: IUniverInstanceService,
        @Inject(SelectionProtectionRuleModel) private _selectionProtectionRuleModel: SelectionProtectionRuleModel

    ) {
        super();
        this._initRender();
        this._selectionProtectionRuleModel.ruleChange$.subscribe((info) => {
            if ((info.oldRule?.id && this._selectionProtectionRenderExtension.renderCache.has(info.oldRule.id)) || this._selectionProtectionRenderExtension.renderCache.has(info.rule.id)) {
                this._selectionProtectionRenderExtension.clearCache();
            }
        });
    }

    private _initRender() {
        const register = (renderId: string) => {
            const render = renderId && this._renderManagerService.getRenderById(renderId);
            const spreadsheetRender = render && render.mainComponent as Spreadsheet;
            if (spreadsheetRender) {
                if (!spreadsheetRender.getExtensionByKey(selectionProtectionKey)) {
                    spreadsheetRender.register(this._selectionProtectionRenderExtension);
                }
            }
        };
        this.disposeWithMe(this._renderManagerService.currentRender$.subscribe((renderId) => {
            renderId && register(renderId);
        }));
        const workbook = this._univerInstanceService.getCurrentUnitForType(UniverInstanceType.UNIVER_SHEET)!;
        if (workbook) {
            register(workbook.getUnitId());
        }
    }
}

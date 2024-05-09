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

import { BehaviorSubject } from 'rxjs';

type ActiveCommentInfo = { unitId: string; subUnitId: string; commentId: string } | undefined;

export class ThreadCommentPanelService {
    private _panelVisible = false;
    private _panelVisible$ = new BehaviorSubject<boolean>(false);

    private _activeCommentId: ActiveCommentInfo;
    private _activeCommentId$ = new BehaviorSubject<ActiveCommentInfo>(undefined);

    panelVisible$ = this._panelVisible$.asObservable();
    activeCommentId$ = this._activeCommentId$.asObservable();

    get panelVisible() {
        return this._panelVisible;
    }

    get activeCommentId() {
        return this._activeCommentId;
    }

    setPanelVisible(visible: boolean) {
        this._panelVisible = visible;
        this._panelVisible$.next(visible);
    }

    setActiveComment(commentInfo: ActiveCommentInfo) {
        this._activeCommentId = commentInfo;
        this._activeCommentId$.next(commentInfo);
    }
}